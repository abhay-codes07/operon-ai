import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthSession } from "@/server/auth/session";

export default async function SignUpPage(): Promise<JSX.Element> {
  const session = await getAuthSession();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="py-16">
      <AppShell className="max-w-lg">
        <SignUpForm />
      </AppShell>
    </main>
  );
}
