"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Style = { id: string; name: string; slug: string };

export function StyleFilterPills({ styles, activeSlug }: { styles: Style[]; activeSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("styleSlug", slug);
    } else {
      params.delete("styleSlug");
    }
    params.delete("page");
    router.push(`/feed?${params.toString()}`);
  }

  const pillClass = (active: boolean) =>
    `cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:bg-muted/70"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button className={pillClass(!activeSlug)} onClick={() => handleSelect("")}>
        Tous
      </button>
      {styles.map((s) => (
        <button
          key={s.id}
          className={pillClass(activeSlug === s.slug)}
          onClick={() => handleSelect(s.slug)}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
