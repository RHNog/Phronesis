"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function SignOutButton({ className = "" }: { className?: string }) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    window.location.assign("/sign-in");
  }

  return <button type="button" onClick={signOut} disabled={pending} className={className}>{pending ? "Signing out…" : "Sign out"}</button>;
}
