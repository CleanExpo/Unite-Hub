import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-sm border border-white/[0.08] bg-[#050505] px-3 py-2 text-[13px] text-white/90 placeholder:text-white/40 focus-visible:outline-none focus-visible:border-[#00F5FF]/50 focus-visible:ring-1 focus-visible:ring-[#00F5FF]/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
