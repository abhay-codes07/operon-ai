import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { getAuthSession } from "@/server/auth/session";
import { Zap } from "lucide-react";

export default async function SignInPage(): Promise<JSX.Element> {
  const session = await getAuthSession();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <Zap className="text-white" size={20} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Operon</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in to your AI automation console</p>
          </div>
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
