import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Set up your school — Lumio" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("student_profiles")
    .select("first_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-4 sm:px-8">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-5 py-12">
        <div className="mb-8 max-w-xl text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Let&rsquo;s build your school
          </h1>
          <p className="mt-2 text-muted">
            Three quick steps to set up your personal teacher.
          </p>
        </div>
        <OnboardingFlow defaultFirstName={profile?.first_name ?? ""} />
      </main>
    </>
  );
}
