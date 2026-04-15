import { toast } from "sonner";

type ApiOptions<T> = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  onSuccess?: (data: T) => void;
  successMessage?: string;
  errorMessage?: string;
};

export async function apiFetch<T = void>(
  url: string,
  options: ApiOptions<T>,
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: options.method,
      headers: { "Content-Type": "application/json" },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      toast.error(options.errorMessage ?? "Une erreur est survenue.");
      return null;
    }

    const contentType = res.headers.get("content-type");
    const data = contentType?.includes("application/json")
      ? ((await res.json()) as T)
      : (undefined as T);

    if (options.successMessage) toast.success(options.successMessage);
    options.onSuccess?.(data);
    return data;
  } catch {
    toast.error(options.errorMessage ?? "Une erreur est survenue.");
    return null;
  }
}
