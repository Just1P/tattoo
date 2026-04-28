"use client";

import { authClient } from "@/lib/auth-client";

export function useLastLoginMethod() {
  return authClient.getLastUsedLoginMethod();
}

export function RecentBadge() {
  return (
    <span className="absolute -top-2.5 -right-2.5 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground leading-none">
      Récent
    </span>
  );
}
