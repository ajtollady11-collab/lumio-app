import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 focus-ring rounded-sm ${className}`}
      aria-label="Lumio home"
    >
      <span aria-hidden className="grid h-7 w-7 place-items-center">
        <svg viewBox="0 0 28 28" className="h-7 w-7" fill="none">
          <rect width="28" height="28" rx="8" fill="var(--ink)" />
          {/* a small 'lamp / spark of learning' mark */}
          <circle cx="14" cy="12" r="5" fill="var(--gold)" />
          <path
            d="M11 18.5h6M12 21h4"
            stroke="var(--paper)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-ink">
        Lumio
      </span>
    </Link>
  );
}
