import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getAuthSession } from "@/server/auth/session";

export default async function SignInPage(): Promise<JSX.Element> {
  const session = await getAuthSession();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="py-16">
      <AppShell className="max-w-lg">
        <SignInForm />
      </AppShell>
    </main>
  );
}
