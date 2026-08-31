import { Logo } from "./Logo";
import { ButtonLink } from "./Button";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-[var(--line)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <ButtonLink href="/login" variant="ghost" size="md">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" variant="primary" size="md">
            Create your school
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
