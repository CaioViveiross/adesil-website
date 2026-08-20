import { cn } from "@/lib/utils";

interface DiscountBadgeProps {
  /** Percentual de desconto do produto. Nada é renderizado se ausente ou zero. */
  discount?: number;
  /** "sm" para cards e carrinho, "md" para a página do produto. */
  size?: "sm" | "md";
  className?: string;
}

const sizeStyles = {
  sm: "text-[10px] px-2 py-0.5 rounded-md",
  md: "text-xs px-2.5 py-1 rounded-lg",
};

const DiscountBadge = ({ discount, size = "sm", className }: DiscountBadgeProps) => {
  if (!discount) return null;

  return (
    <span
      className={cn(
        "inline-block bg-emerald-100 text-emerald-700 font-bold leading-none uppercase tracking-wide",
        sizeStyles[size],
        className
      )}
    >
      {discount}% off
    </span>
  );
};

export default DiscountBadge;
