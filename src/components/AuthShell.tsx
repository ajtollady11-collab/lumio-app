import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[0_24px_60px_-40px_rgba(23,26,43,0.4)] sm:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-6 text-center text-sm text-muted">{footer}</div>
      </div>
    </main>
  );
}
