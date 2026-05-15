"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** macOS Finder-style folder (Big Sur+) */
export function MacOSFolderIcon({
  className,
  variant = "blue",
}: {
  className?: string;
  variant?: "blue" | "new";
}) {
  const uid = useId().replace(/:/g, "");
  const isNew = variant === "new";
  const back = `folder-back-${uid}`;
  const front = `folder-front-${uid}`;
  const tab = `folder-tab-${uid}`;
  const shadow = `folder-shadow-${uid}`;

  return (
    <svg
      viewBox="0 0 120 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[88px] w-[110px] drop-shadow-lg", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={back} x1="60" y1="8" x2="60" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor={isNew ? "#8E8E93" : "#3d8ef5"} />
          <stop offset="1" stopColor={isNew ? "#636366" : "#1a6fd4"} />
        </linearGradient>
        <linearGradient id={front} x1="60" y1="24" x2="60" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor={isNew ? "#AEAEB2" : "#6eb0ff"} />
          <stop offset="0.45" stopColor={isNew ? "#8E8E93" : "#4a9eff"} />
          <stop offset="1" stopColor={isNew ? "#636366" : "#2b7de0"} />
        </linearGradient>
        <linearGradient id={tab} x1="32" y1="4" x2="32" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor={isNew ? "#C7C7CC" : "#8ec4ff"} />
          <stop offset="1" stopColor={isNew ? "#AEAEB2" : "#5aa8ff"} />
        </linearGradient>
        <filter id={shadow} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#${shadow})`}>
        <path
          d="M8 28C8 22.477 12.477 18 18 18H42L52 10H102C107.523 10 112 14.477 112 20V80C112 85.523 107.523 90 102 90H18C12.477 90 8 85.523 8 80V28Z"
          fill={`url(#${back})`}
        />
        <path
          d="M18 18H42L52 10H72C78.627 10 84 15.373 84 22V28H18V18Z"
          fill={`url(#${tab})`}
        />
        <path
          d="M8 36C8 30.477 12.477 26 18 26H102C107.523 26 112 30.477 112 36V80C112 85.523 107.523 90 102 90H18C12.477 90 8 85.523 8 80V36Z"
          fill={`url(#${front})`}
        />
        {isNew && (
          <g stroke="white" strokeWidth="3.5" strokeLinecap="round">
            <line x1="60" y1="44" x2="60" y2="72" />
            <line x1="46" y1="58" x2="74" y2="58" />
          </g>
        )}
      </g>
    </svg>
  );
}
