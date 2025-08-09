"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col h-[100vh] items-center justify-center bg-black overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
