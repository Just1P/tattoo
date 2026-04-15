"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import Typography from "@/components/custom/Typography";
import { type VariantProps } from "class-variance-authority";
import { useState, useRef, useEffect } from "react";
import {
  WhatsappShareButton,
  WhatsappIcon,
  TwitterShareButton,
  XIcon,
  FacebookShareButton,
  FacebookIcon,
  TelegramShareButton,
  TelegramIcon,
} from "react-share";
import { Link, Check } from "lucide-react";
import { toast } from "sonner";

type ShareButtonProps = { url: string; title: string } & Pick<
  VariantProps<typeof buttonVariants>,
  "size"
>;

export function ShareButton({ url, title, size }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  }

  return (
    <div ref={ref} className="relative">
      <Button variant="outline" size={size} onClick={() => setOpen((o) => !o)}>
        Partager
      </Button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-52 -translate-x-1/2 rounded-xl border border-border bg-card p-3 shadow-md">
          <Typography tag="p" color="muted" size="xs" className="mb-2 text-center">
            Partager via
          </Typography>
          <div className="flex justify-center gap-3">
            <WhatsappShareButton url={url} title={title}>
              <WhatsappIcon size={36} round />
            </WhatsappShareButton>
            <TwitterShareButton url={url} title={title}>
              <XIcon size={36} round />
            </TwitterShareButton>
            <FacebookShareButton url={url}>
              <FacebookIcon size={36} round />
            </FacebookShareButton>
            <TelegramShareButton url={url} title={title}>
              <TelegramIcon size={36} round />
            </TelegramShareButton>
          </div>
          <button
            onClick={copyLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            {copied ? (
              <Check className="size-4 text-primary" />
            ) : (
              <Link className="size-4" />
            )}
            <Typography tag="span" size="xs">
              {copied ? "Lien copié !" : "Copier le lien"}
            </Typography>
          </button>
        </div>
      )}
    </div>
  );
}
