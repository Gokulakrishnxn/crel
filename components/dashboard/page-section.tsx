import { cn } from "@/lib/utils";

export function PageSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-[14px] text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
