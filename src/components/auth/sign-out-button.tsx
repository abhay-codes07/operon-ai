"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton(): JSX.Element {
  return (
    <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}>
      Sign Out
    </Button>
  );
}
