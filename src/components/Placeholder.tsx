import type { ReactNode } from "react";

/**
 * A clearly-identifiable placeholder for functionality that is not yet built
 * (AI teaching, lessons, tests). Never fakes working features.
 */
export function Placeholder({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-paper-2/60 p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[var(--gold)]/20 px-2 py-0.5 text-xs font-medium text-[#8a6a13]">
          Coming soon
        </span>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
