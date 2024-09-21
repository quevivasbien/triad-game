"use client";

import { signInAnonymouslyAction } from "@/app/actions";
import Turnstile from "react-turnstile";


async function onverify(token: string) {
  console.log("Signing in anonymously with token: " + token);
  await signInAnonymouslyAction(token);
}

export default function Login() {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!sitekey) {
    throw new Error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
  }

  return (
    <div className="mx-auto">
      <Turnstile
        sitekey={sitekey}
        onVerify={onverify}
      />
    </div>
  );
}
