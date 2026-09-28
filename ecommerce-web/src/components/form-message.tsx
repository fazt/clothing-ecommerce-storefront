import { cn } from "@/lib/utils";

export function FieldError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p className={cn("text-xs text-destructive", className)} role="alert">
      {message}
    </p>
  );
}

export function FormAlert({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
      role="alert"
    >
      {message}
    </div>
  );
}
