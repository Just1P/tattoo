import { Label } from "@/components/ui/label";
import Typography from "@/components/custom/Typography";
import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({ id, label, error, className, children }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {children}
      {error && (
        <Typography tag="p" color="destructive">
          {error}
        </Typography>
      )}
    </div>
  );
}
