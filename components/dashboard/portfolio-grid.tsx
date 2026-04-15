"use client";

import Typography from "@/components/custom/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Style = { id: string; name: string };

type Tattoo = {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  position: number;
  pinned: boolean;
  style: { id: string; name: string };
};

type EditState = {
  title: string;
  description: string;
  styleId: string;
};

function SortableTattooCard({
  tattoo,
  styles,
  onDelete,
  onTogglePin,
  onEdit,
}: {
  tattoo: Tattoo;
  styles: Style[];
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onEdit: (id: string, data: EditState) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tattoo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditState>({
    title: tattoo.title ?? "",
    description: tattoo.description ?? "",
    styleId: tattoo.style.id,
  });
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    await onEdit(tattoo.id, editData);
    setIsSaving(false);
    setIsEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative overflow-hidden rounded-lg border border-border bg-card"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-10 cursor-grab rounded-md bg-black/50 p-1 opacity-0 transition-smooth transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-4 text-white" />
      </div>

      {tattoo.pinned && (
        <div className="absolute right-2 top-2 z-10">
          <Badge variant="default" className="text-xs">
            Épinglé
          </Badge>
        </div>
      )}

      <div className="relative aspect-square bg-muted">
        <Image
          src={tattoo.imageUrl}
          alt={tattoo.title ?? "Tatouage"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      {isEditing ? (
        <div className="space-y-3 p-3">
          <div className="space-y-1">
            <Label htmlFor={`title-${tattoo.id}`}>Titre</Label>
            <Input
              id={`title-${tattoo.id}`}
              value={editData.title}
              onChange={(e) =>
                setEditData((d) => ({ ...d, title: e.target.value }))
              }
              placeholder="Titre de l'œuvre"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`desc-${tattoo.id}`}>Description</Label>
            <Textarea
              id={`desc-${tattoo.id}`}
              value={editData.description}
              onChange={(e) =>
                setEditData((d) => ({ ...d, description: e.target.value }))
              }
              rows={2}
              placeholder="Description"
            />
          </div>
          <div className="space-y-1">
            <Label>Style</Label>
            <div className="flex flex-wrap gap-1">
              {styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setEditData((d) => ({ ...d, styleId: s.id }))}
                  className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Badge
                    variant={editData.styleId === s.id ? "default" : "outline"}
                    className="text-xs"
                  >
                    {s.name}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Check className="size-3.5" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              <X className="size-3.5" />
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <div className="mb-2 flex items-start justify-between gap-1">
            <div className="min-w-0">
              {tattoo.title && (
                <Typography tag="p" weight="medium" className="truncate">
                  {tattoo.title}
                </Typography>
              )}
              <Typography tag="p" color="muted" size="xs">
                {tattoo.style.name}
              </Typography>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              title="Modifier"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTogglePin(tattoo.id, !tattoo.pinned)}
              title={tattoo.pinned ? "Désépingler" : "Épingler"}
            >
              {tattoo.pinned ? (
                <PinOff className="size-3.5" />
              ) : (
                <Pin className="size-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(tattoo.id)}
              title="Supprimer"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PortfolioGrid({
  initialTattoos,
  styles,
}: {
  initialTattoos: Tattoo[];
  styles: Style[];
}) {
  const [mounted, setMounted] = useState(false);
  const [tattoos, setTattoos] = useState(initialTattoos);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tattoos.findIndex((t) => t.id === active.id);
    const newIndex = tattoos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tattoos, oldIndex, newIndex).map((t, i) => ({
      ...t,
      position: i,
    }));
    setTattoos(reordered);

    const res = await fetch(`/api/tattoos/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: newIndex }),
    });

    if (!res.ok) {
      setTattoos(tattoos);
      toast.error("Erreur lors du réordonnancement.");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tattoos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erreur lors de la suppression.");
      return;
    }
    setTattoos((prev) => prev.filter((t) => t.id !== id));
    toast.success("Œuvre supprimée.");
  }

  async function handleTogglePin(id: string, pinned: boolean) {
    const res = await fetch(`/api/tattoos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });
    if (!res.ok) {
      toast.error("Erreur lors de la mise à jour.");
      return;
    }
    setTattoos((prev) => prev.map((t) => (t.id === id ? { ...t, pinned } : t)));
    toast.success(pinned ? "Œuvre épinglée." : "Œuvre désépinglée.");
  }

  async function handleEdit(id: string, data: EditState) {
    const res = await fetch(`/api/tattoos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Erreur lors de la modification.");
      return;
    }
    setTattoos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: data.title || null,
              description: data.description || null,
              style: styles.find((s) => s.id === data.styleId) ?? t.style,
            }
          : t,
      ),
    );
    toast.success("Œuvre mise à jour.");
  }

  if (tattoos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border py-20">
        <Typography tag="p" color="muted">
          Aucune œuvre dans votre portfolio.
        </Typography>
        <Button asChild>
          <Link href="/dashboard/portfolio/new">Ajouter une œuvre</Link>
        </Button>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tattoos.map((t) => t.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tattoos.map((tattoo) => (
            <SortableTattooCard
              key={tattoo.id}
              tattoo={tattoo}
              styles={styles}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
