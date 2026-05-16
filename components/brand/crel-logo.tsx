import Image from "next/image";
import { cn } from "@/lib/utils";

/** Pixel wordmark from Logo.png (330×127 crop) */
const ASPECT = 330 / 127;

export function CrelLogo({
  className,
  height = 28,
  priority,
}: {
  className?: string;
  /** Target height in px; width scales from wordmark aspect ratio */
  height?: number;
  priority?: boolean;
}) {
  const width = Math.round(height * ASPECT);

  return (
    <Image
      src="/crel-wordmark.png"
      alt="Crel"
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "block shrink-0 object-contain object-left",
        "invert dark:invert-0",
        className
      )}
      style={{ height, width: "auto", maxHeight: height }}
    />
  );
}
