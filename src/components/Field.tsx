import type { ComponentProps, ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-ring";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={`${controlClass} appearance-none ${props.className ?? ""}`}
    />
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-[#e7b7b0] bg-[#fdf1ef] px-3.5 py-2.5 text-sm text-[#9a3226]"
    >
      {children}
    </p>
  );
}
