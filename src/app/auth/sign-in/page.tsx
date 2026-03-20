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
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Zap className="text-blue-400" size={32} />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">Operon</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-slate-400">Enter your credentials to access your AI automation console</p>
        </div>

        {/* Form Container */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-8 backdrop-blur-sm">
          <SignInForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>Don't have an account? <a href="/auth/sign-up" className="text-blue-400 hover:text-cyan-400 transition-colors font-semibold">Sign up for free</a></p>
        </div>
      </div>
    </main>
  );
}
