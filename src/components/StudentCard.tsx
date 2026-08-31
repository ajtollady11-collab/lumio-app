/**
 * The signature Lumio motif: a personal "student card" for a school of one.
 * Reinforces the positioning — your own school, your own teacher.
 * Used on the hero (with sample data) and can be reused elsewhere.
 */
export function StudentCard({
  studentName = "Maya",
  teacherName = "Professor Ada",
  subjects = ["Mathematics", "Physics", "History"],
  year = "Year 10",
  className = "",
}: {
  studentName?: string;
  teacherName?: string;
  subjects?: string[];
  year?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full max-w-sm rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_-30px_rgba(23,26,43,0.45)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-ink">
          Lumio · School of one
        </span>
        <span
          aria-hidden
          className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gold)]/20"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3z"
              fill="var(--gold)"
            />
          </svg>
        </span>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--indigo)] text-xl font-semibold text-white">
          {studentName.charAt(0)}
        </div>
        <div>
          <p className="text-xs text-muted">Student</p>
          <p className="font-display text-2xl font-semibold leading-tight text-ink">
            {studentName}
          </p>
          <p className="text-sm text-muted">{year}</p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 border-t border-[var(--line)] pt-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Teacher</dt>
          <dd className="font-medium text-ink">{teacherName}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted">Subjects</dt>
          <dd className="text-right font-medium text-ink">
            {subjects.join(" · ")}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--sage)]/12 px-4 py-3">
        <span
          aria-hidden
          className="h-2 w-2 rounded-full bg-[var(--sage)]"
        />
        <p className="text-xs text-ink-2">
          Adapts to {studentName}&rsquo;s pace, remembers what&rsquo;s hard.
        </p>
      </div>
    </div>
  );
}
