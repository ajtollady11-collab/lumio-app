/**
 * A realistic Lumio product mockup used in the hero — progress ring, subject
 * mastery, AI recommendation, weak-area flag, recent activity, plus floating
 * UI chips. Purely presentational (sample data), reinforces "real product".
 */
export function HeroDashboard() {
  return (
    <div className="relative">
      <div
        className="rise relative z-[2] rounded-[26px] border border-white/90 bg-white/75 p-[18px] backdrop-blur-xl"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-1.5 pb-3.5 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)] text-base font-semibold text-white">
              M
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">
                Maya&rsquo;s school
              </div>
              <div className="text-xs text-muted">Year 10 · GCSE</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--line)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--line)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--line)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* mastery ring */}
          <div className="rounded-2xl border border-[var(--line-2)] bg-paper-3 p-3.5">
            <span className="text-[11px] font-medium text-muted">
              Overall mastery
            </span>
            <div className="mt-2 flex items-center gap-3.5">
              <div
                className="relative grid h-[66px] w-[66px] shrink-0 place-items-center rounded-full"
                style={{
                  background:
                    "conic-gradient(var(--sage) 78%, var(--paper-2) 0)",
                }}
              >
                <div className="absolute inset-2 rounded-full bg-paper-3" />
                <span className="relative z-[1] font-display text-[15px] font-bold">
                  78%
                </span>
              </div>
              <div>
                <div className="font-display text-[22px] font-semibold leading-none">
                  On track
                </div>
                <div className="mt-[3px] text-xs text-muted">+6% this week</div>
              </div>
            </div>
          </div>

          {/* subject mastery */}
          <div className="rounded-2xl border border-[var(--line-2)] bg-paper-3 p-3.5">
            <span className="text-[11px] font-medium text-muted">
              Subject mastery
            </span>
            <Bar label="Maths" value={82} tone="indigo" />
            <Bar label="Physics" value={64} tone="sage" />
            <Bar label="History" value={45} tone="gold" />
          </div>

          {/* AI recommendation */}
          <div className="col-span-2 rounded-2xl border border-[var(--line-2)] bg-paper-3 p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[var(--indigo)]/12">
                <StarIcon />
              </span>
              <div className="text-[12.5px] leading-snug text-ink-2">
                <b className="font-semibold text-ink">AI recommendation.</b>{" "}
                Maya&rsquo;s quadratic equations are solid — next, focus on
                trigonometry, where recent answers show a weak spot.
              </div>
            </div>
          </div>

          {/* weak area */}
          <div className="rounded-2xl border border-[var(--line-2)] bg-paper-3 p-3.5">
            <span className="text-[11px] font-medium text-muted">
              Weak area detected
            </span>
            <div className="mt-2 flex items-center justify-between text-[12.5px]">
              <span className="font-medium text-[var(--coral)]">
                Trigonometry
              </span>
              <span className="text-muted">needs work</span>
            </div>
            <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-paper-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: "30%",
                  background:
                    "linear-gradient(90deg,#ed9a86,var(--coral))",
                }}
              />
            </div>
          </div>

          {/* recent activity */}
          <div className="rounded-2xl border border-[var(--line-2)] bg-paper-3 p-3.5">
            <span className="text-[11px] font-medium text-muted">
              Recent activity
            </span>
            <div className="mt-2 flex flex-col gap-2.5">
              <Activity color="var(--sage)" text="Completed: Algebra check" />
              <Activity color="var(--indigo)" text="Plan updated by Lumio" />
              <Activity color="var(--gold)" text="New lesson unlocked" />
            </div>
          </div>
        </div>
      </div>

      {/* floating chips */}
      <Chip className="floaty top-[8%] left-[-6%] max-[1000px]:left-0" tone="var(--sage)">
        Maths · 82% mastered
      </Chip>
      <Chip
        className="floaty2 top-[40%] right-[-8%] max-[1000px]:right-0"
        tone="var(--coral)"
      >
        Weak area detected
      </Chip>
      <Chip className="floaty3 bottom-[6%] left-[2%]" tone="var(--indigo)">
        Learning plan updated
      </Chip>
    </div>
  );
}

function Bar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "indigo" | "sage" | "gold";
}) {
  const grad =
    tone === "sage"
      ? "linear-gradient(90deg,#8fbfa6,var(--sage))"
      : tone === "gold"
        ? "linear-gradient(90deg,#f0cd74,var(--gold))"
        : "linear-gradient(90deg,var(--indigo-2),var(--indigo))";
  return (
    <>
      <div className="mt-2.5 flex items-center justify-between text-[12.5px]">
        <span className="font-medium text-ink-2">{label}</span>
        <span className="tabular-nums text-muted">{value}%</span>
      </div>
      <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-paper-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: grad }}
        />
      </div>
    </>
  );
}

function Activity({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-ink-2">
      <span
        className="h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ background: color }}
      />
      {text}
    </div>
  );
}

function Chip({
  children,
  className = "",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: string;
}) {
  return (
    <span
      className={`absolute z-[3] inline-flex items-center gap-2 whitespace-nowrap rounded-[13px] border border-white/90 bg-white/95 px-3.5 py-2.5 text-[12.5px] font-medium text-ink backdrop-blur max-[560px]:text-[11.5px] ${className}`}
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: tone }}
      />
      {children}
    </span>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z"
        fill="var(--indigo)"
      />
    </svg>
  );
}
