import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/20 hover:from-sky-600 hover:to-blue-700 hover:shadow-lg transition-all duration-300",
        destructive:
          "bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600",
        outline:
          "border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900",
        secondary:
          "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100",
        ghost:
          "hover:bg-slate-50 hover:text-slate-900",
        link: "text-blue-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm", // Standard size, slightly refined
        sm: "h-8 rounded-md px-3 text-xs font-medium", // Compact
        lg: "h-10 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
