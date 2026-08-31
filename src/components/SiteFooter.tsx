import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
        <p className="text-sm text-muted">
          Your own school. Your own teacher. Your own way.
        </p>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Lumio. Built for learners.
        </p>
      </div>
    </footer>
  );
}
