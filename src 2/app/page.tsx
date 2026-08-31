import { ButtonLink } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroDashboard } from "@/components/HeroDashboard";
import { Reveal } from "@/components/Reveal";

const promises = [
  { title: "Knows you", body: "Your teacher learns your year, curriculum and subjects — then teaches around them." },
  { title: "Teaches you", body: "Lessons delivered one to one, at your level, in a voice and style you chose yourself." },
  { title: "Adapts to you", body: "Answer well and it moves on. Struggle, and it slows down and explains a different way." },
  { title: "Tests you", body: "Short, personal checks built from what you've actually studied — never generic worksheets." },
  { title: "Remembers your struggles", body: "Every gap you hit is noted, then revisited later so it doesn't quietly become a bigger problem." },
  { title: "Helps you improve", body: "Progress you can see, week over week, subject by subject — so effort turns into mastery." },
];

const steps = [
  { num: "01 — Assess", title: "Understand", body: "Lumio works out exactly where the student is right now, across every subject they've chosen." },
  { num: "02 — Personalise", title: "Build the path", body: "AI creates and adapts a learning plan shaped around their strengths, gaps and pace." },
  { num: "03 — Improve", title: "Keep adapting", body: "The student works through targeted learning, and Lumio continuously adjusts as they improve." },
];

export default function Home() {
  return (
    <>
      {/* Floating navbar */}
      <div className="sticky top-0 z-50 py-3.5">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div
            className="flex items-center justify-between gap-4 rounded-full border border-[var(--line)]/90 bg-paper-3/75 py-2.5 pl-[18px] pr-3 backdrop-blur-xl"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <Logo />
            <nav className="flex items-center gap-2">
              <ButtonLink href="/login" variant="ghost" size="md" className="hidden sm:inline-flex">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" variant="primary" size="md">
                Create your school
              </ButtonLink>
            </nav>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* HERO */}
        <section className="paper-tint relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-11 px-5 py-12 sm:px-8 lg:grid-cols-[1.02fr_1.1fr] lg:items-center lg:py-16">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/65 py-1.5 pl-2 pr-3.5 text-[13px] font-medium text-ink-2"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[var(--indigo-2)] to-[var(--indigo)]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3z" fill="#fff" />
                  </svg>
                </span>
                A personal AI school for every student
              </span>
              <h1 className="mt-5 font-display text-[clamp(42px,7vw,74px)] font-semibold leading-[1.02] tracking-[-0.03em]">
                Your own school.
                <br />
                Your own teacher.
                <br />
                <span className="text-ink-soft">Your own way.</span>
              </h1>
              <p className="mt-5 max-w-[32rem] text-[clamp(16px,2.1vw,19px)] leading-relaxed text-ink-2">
                Lumio gives every student a personal AI teacher that knows them,
                adapts to them, and helps them genuinely improve — at their own
                pace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/signup" variant="primary" size="lg">
                  Create your school →
                </ButtonLink>
                <ButtonLink href="#how" variant="secondary" size="lg">
                  See how it works
                </ButtonLink>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3.5 text-[13.5px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Check /> Free to start
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield /> Built for children&rsquo;s safety
                </span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroDashboard />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <span className="section-eyebrow inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide text-indigo before:h-[1.5px] before:w-[22px] before:rounded before:bg-indigo before:opacity-60 before:content-['']">
              What Lumio does
            </span>
            <h2 className="mt-3.5 font-display text-[clamp(28px,4.4vw,44px)] font-semibold leading-[1.08] tracking-[-0.025em]">
              A teacher built entirely
              <br />
              around one student
            </h2>
            <p className="mt-4 max-w-[40rem] text-[clamp(16px,2vw,19px)] leading-relaxed text-ink-2">
              Not a chatbot bolted onto a course. A teacher that treats each
              student&rsquo;s education as personal — because it is.
            </p>
          </Reveal>

          <div className="mt-13 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {promises.map((p, i) => (
              <Reveal key={p.title} delay={((i % 3) + 1) as 1 | 2 | 3} className="bg-white">
                <div className="h-full p-7 transition-transform hover:-translate-y-1">
                  <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="px-5 pb-4 sm:px-8">
          <div className="relative overflow-hidden rounded-[32px] bg-ink text-white">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(60% 60% at 85% 0%, rgba(122,114,240,.28), transparent 60%), radial-gradient(50% 50% at 0% 100%, rgba(232,184,75,.16), transparent 60%)",
              }}
            />
            <div className="relative z-[1] px-6 py-16 sm:px-14 sm:py-20">
              <Reveal>
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide text-[var(--indigo-2)] before:h-[1.5px] before:w-[22px] before:rounded before:bg-[var(--indigo-2)] before:opacity-70 before:content-['']">
                  How Lumio works
                </span>
                <h2 className="mt-3.5 font-display text-[clamp(28px,4.4vw,44px)] font-semibold leading-[1.08] tracking-[-0.025em] text-white">
                  From &ldquo;where am I?&rdquo;
                  <br />
                  to genuine progress
                </h2>
                <p className="mt-4 max-w-[40rem] text-[clamp(16px,2vw,19px)] leading-relaxed text-[#c3c5d6]">
                  A simple journey that never really ends — Lumio keeps adapting
                  as the student grows.
                </p>
              </Reveal>
              <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
                {steps.map((s, i) => (
                  <Reveal key={s.num} delay={(i + 1) as 1 | 2 | 3}>
                    <div className="h-full rounded-[20px] border border-white/10 bg-white/5 p-6 transition-transform hover:-translate-y-1">
                      <div className="font-display text-[15px] font-semibold tracking-wide text-gold">
                        {s.num}
                      </div>
                      <h3 className="mt-3 font-display text-[23px] font-semibold">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#b9bccd]">{s.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FOR PARENTS */}
        <section id="parents" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wide text-indigo before:h-[1.5px] before:w-[22px] before:rounded before:bg-indigo before:opacity-60 before:content-['']">
                For parents
              </span>
              <h2 className="mt-3 font-display text-[clamp(28px,4.4vw,44px)] font-semibold leading-[1.08] tracking-[-0.025em]">
                Real learning,
                <br />
                without the guesswork
              </h2>
              <p className="mt-4 max-w-[40rem] text-[clamp(16px,2vw,19px)] leading-relaxed text-ink-2">
                Focused, one-to-one teaching that meets your child where they
                are. You set it up together, choose the curriculum, and watch
                progress build over time.
              </p>
            </Reveal>
            <Reveal delay={2}>
              <ul className="flex flex-col gap-3">
                {[
                  "Matched to your national curriculum and school year.",
                  "You choose the subjects, the teacher's style, and the pace.",
                  "Progress is tracked so effort turns into measurable mastery.",
                  "Built from the ground up for the safety of younger learners.",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-3 rounded-[15px] border border-[var(--line-2)] bg-white p-4 transition-transform hover:translate-x-1"
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    <span className="mt-0.5 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[var(--sage)]/15">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <path d="M4 10.5l3.5 3.5L16 6" stroke="var(--sage)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[14.5px] leading-relaxed text-ink-2">{t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-16 text-center sm:px-10 sm:py-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(50% 80% at 20% 0%, rgba(122,114,240,.32), transparent 60%), radial-gradient(50% 80% at 90% 100%, rgba(232,184,75,.22), transparent 60%)",
              }}
            />
            <div className="relative z-[1]">
              <h2 className="mx-auto max-w-[20ch] font-display text-[clamp(28px,4.5vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-white">
                Give your student a school that&rsquo;s theirs alone
              </h2>
              <p className="mx-auto mt-4 max-w-[44ch] text-lg text-[#c3c5d6]">
                Set up a personal teacher in a few minutes. Free to start.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink
                  href="/signup"
                  size="lg"
                  className="bg-gold text-ink hover:bg-[var(--gold-deep)]"
                >
                  Create your school →
                </ButtonLink>
                <ButtonLink
                  href="/login"
                  size="lg"
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  Log in
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M4 10.5l3.5 3.5L16 6" stroke="var(--sage)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Shield() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M10 2l6 3v5c0 4-3 6-6 8-3-2-6-4-6-8V5l6-3z" stroke="var(--sage)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
