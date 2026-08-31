import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/Button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-20 text-center">
      <Logo />
      <div>
        <p className="font-display text-6xl font-semibold text-ink">404</p>
        <p className="mt-2 max-w-sm text-muted">
          We couldn&rsquo;t find that page. It may have moved, or never existed.
        </p>
      </div>
      <ButtonLink href="/">Back to Lumio</ButtonLink>
    </main>
  );
}
