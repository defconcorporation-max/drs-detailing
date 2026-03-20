import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow,transform] overflow-hidden shadow-sm backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/95 text-primary-foreground shadow-primary/15 [a&]:hover:bg-primary [a&]:hover:shadow-md",
        secondary:
          "border-border/60 bg-secondary/85 text-secondary-foreground [a&]:hover:bg-secondary [a&]:hover:border-primary/25",
        destructive:
          "border-transparent bg-destructive text-white shadow-destructive/20 [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border/70 bg-card/50 text-foreground dark:border-white/10 dark:bg-white/[0.04] [a&]:hover:bg-accent/80 [a&]:hover:text-accent-foreground [a&]:hover:border-primary/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
