import * as React from "react";
import { cn } from "@/lib/utils";
import { Label as LabelPrimitive } from "@radix-ui/react-label";


function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive>) {
  return (
    <LabelPrimitive
      className={cn(
        "text-sm font-medium text-foreground select-none",
        className
      )}
      {...props}
    />
  )
}

export { Label };

