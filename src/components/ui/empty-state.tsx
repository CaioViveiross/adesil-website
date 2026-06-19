import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** "page" = full centered layout com ícone grande. "compact" = inline/tabela, sem padding extra. */
  variant?: "page" | "compact";
  className?: string;
}

function ActionButton({ action, size }: { action: EmptyStateAction; size: "lg" | "sm" }) {
  const className =
    size === "lg"
      ? "h-11 px-6 rounded-xl font-semibold"
      : "h-8 rounded-lg text-xs px-3";

  const btn = (
    <Button variant={action.variant ?? "default"} className={className} onClick={action.onClick}>
      {action.label}
    </Button>
  );

  if (action.href) {
    return <Link href={action.href}>{btn}</Link>;
  }
  return btn;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "page",
  className,
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-8 text-center", className)}>
        {Icon && <Icon className="h-7 w-7 text-muted-foreground/40 mb-0.5" />}
        <p className="text-sm text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 max-w-xs">{description}</p>
        )}
        {(action || secondaryAction) && (
          <div className="flex gap-2 mt-1">
            {action && <ActionButton action={action} size="sm" />}
            {secondaryAction && <ActionButton action={secondaryAction} size="sm" />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center text-center gap-5 py-20 md:py-28", className)}>
      {Icon && (
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <Icon className="h-9 w-9 text-muted-foreground/50" />
        </div>
      )}
      <div className="space-y-1.5 max-w-xs">
        <p className="font-bold text-xl tracking-tight">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {action && <ActionButton action={action} size="lg" />}
          {secondaryAction && <ActionButton action={secondaryAction} size="lg" />}
        </div>
      )}
    </div>
  );
}
