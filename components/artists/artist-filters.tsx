"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Style = { id: string; name: string; slug: string };

type Props = {
  styles: Style[];
  defaultValues: {
    search: string;
    city: string;
    styleSlug: string;
    minPrice: string;
    maxPrice: string;
  };
};

export function ArtistFilters({ styles, defaultValues }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(defaultValues.search);
  const [city, setCity] = useState(defaultValues.city);
  const [styleSlug, setStyleSlug] = useState(defaultValues.styleSlug);
  const [minPrice, setMinPrice] = useState(defaultValues.minPrice);
  const [maxPrice, setMaxPrice] = useState(defaultValues.maxPrice);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resynchronise les champs quand l'URL change en dehors de ce composant
  // (navigation retour/avant du navigateur). Ajusté pendant le rendu plutôt
  // que dans un effect pour éviter un rendu en cascade.
  const searchParamsString = searchParams.toString();
  const [prevSearchParamsString, setPrevSearchParamsString] = useState(searchParamsString);
  if (searchParamsString !== prevSearchParamsString) {
    setPrevSearchParamsString(searchParamsString);
    setSearch(searchParams.get("search") ?? "");
    setCity(searchParams.get("city") ?? "");
    setStyleSlug(searchParams.get("styleSlug") ?? "");
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
  }

  const hasFilters = search || city || styleSlug || minPrice || maxPrice;

  function buildUrl(overrides: Partial<typeof defaultValues> = {}) {
    const params = new URLSearchParams(searchParams.toString());
    const values = { search, city, styleSlug, minPrice, maxPrice, ...overrides };

    const entries: Record<string, string> = {
      search: values.search,
      city: values.city,
      styleSlug: values.styleSlug,
      minPrice: values.minPrice,
      maxPrice: values.maxPrice,
    };

    for (const [key, value] of Object.entries(entries)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    // Reset to page 1 on filter change
    params.delete("page");

    return `/artists?${params.toString()}`;
  }

  function pushUrl(overrides: Partial<typeof defaultValues> = {}) {
    router.push(buildUrl(overrides));
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushUrl({ search: value });
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleReset() {
    setSearch("");
    setCity("");
    setStyleSlug("");
    setMinPrice("");
    setMaxPrice("");
    router.push("/artists");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Rechercher un artiste..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full sm:w-56"
      />

      <Select
        value={styleSlug || "__all__"}
        onValueChange={(value) => {
          const newSlug = value === "__all__" ? "" : value;
          setStyleSlug(newSlug);
          pushUrl({ styleSlug: newSlug });
        }}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Tous les styles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tous les styles</SelectItem>
          {styles.map((s) => (
            <SelectItem key={s.id} value={s.slug}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Ville"
        value={city}
        onChange={(e) => {
          setCity(e.target.value);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            pushUrl({ city: e.target.value });
          }, 300);
        }}
        className="w-full sm:w-36"
      />

      <Input
        type="number"
        placeholder="Prix min (€)"
        value={minPrice}
        min={0}
        onChange={(e) => {
          setMinPrice(e.target.value);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            pushUrl({ minPrice: e.target.value });
          }, 300);
        }}
        className="w-full sm:w-32"
      />

      <Input
        type="number"
        placeholder="Prix max (€)"
        value={maxPrice}
        min={0}
        onChange={(e) => {
          setMaxPrice(e.target.value);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            pushUrl({ maxPrice: e.target.value });
          }, 300);
        }}
        className="w-full sm:w-32"
      />

      {hasFilters && (
        <Button variant="ghost" onClick={handleReset}>
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
