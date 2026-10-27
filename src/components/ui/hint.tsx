"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * A tooltip for a button, including a disabled one: disabled buttons don't
 * fire pointer events, so the trigger is a wrapping span that does.
 */
export function Hint({
  label,
  children,
  side,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={-1} className="inline-flex">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
