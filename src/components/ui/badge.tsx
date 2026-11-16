import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white",
        brand: "bg-orange-100 text-orange-800 border border-orange-200",
        vegan: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        spicy: "bg-red-100 text-red-800 border border-red-200",
        new: "bg-sky-100 text-sky-800 border border-sky-200",
        outline: "border border-zinc-200 text-zinc-700 bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
