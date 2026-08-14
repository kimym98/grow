import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva("font-bold", {
  variants: {
    size: {
      h1: "text-5xl md:text-6xl lg:text-7xl",
      h2: "text-4xl md:text-5xl",
      h3: "text-3xl md:text-4xl",
      h4: "text-2xl md:text-3xl",
      h5: "text-xl md:text-2xl",
      h6: "text-lg md:text-xl",
    },
  },
  defaultVariants: {
    size: "h2",
  },
})

const textVariants = cva("leading-relaxed", {
  variants: {
    variant: {
      default: "text-base text-foreground",
      muted: "text-base text-muted-foreground",
      lead: "text-xl text-muted-foreground",
      small: "text-sm text-foreground",
      code: "text-sm font-mono bg-muted px-2 py-1 rounded",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, as: Component = "h2", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ size }), className)}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(textVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"
