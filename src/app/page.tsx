import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StudentCard } from "@/components/StudentCard";
import { ButtonLink } from "@/components/Button";

const promises = [
  {
    title: "Knows you",
    body: "Your teacher learns your year, your curriculum and the subjects you care about — then teaches around them.",
  },
  {
    title: "Teaches you",
    body: "Lessons are delivered one to one, at your level, in a voice and style you chose yourself.",
  },
  {
    title: "Adapts to you",
    body: "Answer a question well and it moves on. Struggle, and it slows down and explains it a different way.",
  },
  {
    title: "Tests you",
    body: "Short, personal checks built from what you've actually studied — never generic worksheets.",
  },
  {
    title: "Remembers your struggles",
    body: "Every gap you hit is noted, then revisited later so it doesn't quietly become a bigger problem.",
  },
  {
    title: "Helps you improve",
    body: "Progress you can see, week over week, subject by subject — so effort turns into mastery.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="paper-tint border-b border-[var(--line)]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="rise">
              <p className="text-sm font-medium text-indigo">
                A personal AI school for children &amp; teenagers
              </p>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
                Your own school.
                <br />
                Your own teacher.
                <br />
                Your own way.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
                Lumio gives every student their own school and their own AI
                teacher — one that knows them, teaches them, adapts to them, and
                helps them get genuinely better, at their own pace.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href="/signup" size="lg">
                  Create your school
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" size="lg">
                  I already have one
                </ButtonLink>
              </div>
              <p className="mt-4 text-sm text-muted">
                Free to start. Built with children&rsquo;s safety and privacy in mind.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <StudentCard className="rise" />
            </div>
          </div>
        </section>

        {/* What a Lumio teacher does */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              A teacher built entirely around one student
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-2">
              Not a chatbot bolted onto a course. A teacher that treats your
              education as personal — because it is.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {promises.map((p) => (
              <div key={p.title} className="bg-white p-7">
                <h3 className="font-display text-xl font-semibold text-ink">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* For parents */}
        <section className="border-y border-[var(--line)] bg-paper-2">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-medium text-indigo">For parents</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Real learning, without the guesswork
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-2">
                Lumio is designed to give your child focused, one-to-one
                teaching that meets them where they are. You set it up together,
                choose the curriculum, and watch progress build over time.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                "Matched to your national curriculum and school year.",
                "You choose the subjects, the teacher's style, and the pace.",
                "Progress is tracked so effort turns into measurable mastery.",
                "Built from the ground up for the safety of younger learners.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white p-4"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--sage)]/15"
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
                      <path
                        d="M4 10.5l3.5 3.5L16 6"
                        stroke="var(--sage)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-ink-2">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="rounded-3xl bg-ink px-6 py-14 text-center sm:px-16">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Give your student a school that&rsquo;s theirs alone
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[#c9cbd8]">
              Set up your personal teacher in a few minutes.
            </p>
            <div className="mt-8 flex justify-center">
              <ButtonLink
                href="/signup"
                size="lg"
                className="bg-gold text-ink hover:bg-[#d9a838]"
              >
                Create your school
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
