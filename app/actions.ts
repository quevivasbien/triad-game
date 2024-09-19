"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const signInAnonymouslyAction = async (token: string) => {
  const supabase = createClient();
  const { error } = await supabase.auth.signInAnonymously({
    options: {
      captchaToken: token,
    }
  });
  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }
  return redirect("/");
}

export const createLobbyAction = async (name: string, hasPassword: boolean) => {
  const supabase = createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    throw new Error("No user when creating lobby.");
  }
  // Create entry in publicly-viewable lobbies list
  const { error } = await supabase.from("lobbies").upsert(
    {
      name,
      has_password: hasPassword,
    },
    {
      ignoreDuplicates: false,
      onConflict: "host_id",
    }
  );
  return error;
}