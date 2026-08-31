import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Log in — Lumio" };

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/school");

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to return to your school."
      footer={
        <>
          Don&rsquo;t have a school yet?{" "}
          <Link href="/signup" className="font-medium text-indigo focus-ring">
            Create one
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-64" aria-hidden />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
