import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { Placeholder } from "@/components/Placeholder";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile, TeacherProfile } from "@/types";
import { PERSONALITY_OPTIONS } from "@/types";

export const metadata = { title: "Your school — Lumio" };

export default async function SchoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<StudentProfile>();

  // No profile yet → send them through onboarding first.
  if (!student) redirect("/onboarding");

  const { data: teacher } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("student_id", student.id)
    .maybeSingle<TeacherProfile>();

  const personalityLabel =
    PERSONALITY_OPTIONS.find((p) => p.value === teacher?.personality)?.label ??
    teacher?.personality ??
    "—";

  const subjects = student.subjects ?? [];

  return (
    <>
      <header className="border-b border-[var(--line)] bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo />
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="secondary" size="md">
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
        {/* Greeting */}
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted">Welcome back to your school</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
            Hello, {student.first_name}
          </h1>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Current learning area */}
          <section className="rounded-3xl border border-[var(--line)] bg-white p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-ink">
                Current learning
              </h2>
              {student.curriculum ? (
                <span className="rounded-full bg-paper-2 px-3 py-1 text-xs text-ink-2">
                  {student.curriculum}
                </span>
              ) : null}
            </div>

            <div className="mt-5 rounded-2xl bg-ink px-6 py-8 text-white">
              <p className="text-sm text-[#c9cbd8]">
                Your teacher is being prepared
              </p>
              <p className="mt-2 max-w-md font-display text-2xl font-semibold leading-snug">
                Lessons with {teacher?.teacher_name ?? "your teacher"} start
                here soon.
              </p>
              <div className="mt-6">
                <Button
                  disabled
                  size="lg"
                  className="bg-gold text-ink hover:bg-gold"
                  aria-describedby="start-note"
                >
                  Start learning
                </Button>
                <p id="start-note" className="mt-3 text-xs text-[#a7aabb]">
                  Available once interactive lessons are switched on.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Placeholder title="Interactive lectures">
                Voice-led, adaptive lessons that respond to your answers in real
                time.
              </Placeholder>
              <Placeholder title="Personal tests">
                Short checks built from what you&rsquo;ve studied, marked
                instantly.
              </Placeholder>
            </div>
          </section>

          {/* Side column: teacher + subjects + progress */}
          <div className="space-y-6">
            {/* Teacher / profile */}
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <h2 className="text-sm font-medium text-muted">Your teacher</h2>
              {teacher ? (
                <div className="mt-3 flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--indigo)] text-lg font-semibold text-white">
                    {teacher.teacher_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">
                      {teacher.teacher_name}
                    </p>
                    <p className="text-sm text-muted">
                      {personalityLabel} · {teacher.voice_preference} voice
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  No teacher set up yet.
                </p>
              )}
            </section>

            {/* Subjects */}
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <h2 className="text-sm font-medium text-muted">Your subjects</h2>
              {subjects.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <li
                      key={s}
                      className="rounded-full border border-[var(--line)] bg-paper-2 px-3 py-1 text-sm text-ink-2"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  No subjects chosen yet.
                </p>
              )}
            </section>

            {/* Progress */}
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6">
              <h2 className="text-sm font-medium text-muted">
                Learning progress
              </h2>
              <div className="mt-4 space-y-4">
                {(subjects.length > 0 ? subjects : ["Your subjects"]).map(
                  (s) => (
                    <div key={s}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-2">{s}</span>
                        <span className="text-muted">Not started</span>
                      </div>
                      <div
                        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper-2"
                        role="progressbar"
                        aria-valuenow={0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${s} progress`}
                      >
                        <div className="h-full w-0 bg-[var(--sage)]" />
                      </div>
                    </div>
                  ),
                )}
              </div>
              <p className="mt-4 text-xs text-muted">
                Mastery tracking begins once you start your first lesson.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
