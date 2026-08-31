import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/SignupForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Create your school — Lumio" };

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/school");

  return (
    <AuthShell
      title="Create your school"
      subtitle="Set up an account, then build your personal teacher."
      footer={
        <>
          Already have a school?{" "}
          <Link href="/login" className="font-medium text-indigo focus-ring">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
