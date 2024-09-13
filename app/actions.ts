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

export const createLobbyAction = async (name: string) => {
  const supabase = createClient();
  const { error } = await supabase.from("lobbies").upsert(
    {
      created_at: new Date(),
      name,
      guest_ids: [],
    },
    {
      ignoreDuplicates: false,
      onConflict: "host_id",
    }
  );
  return error;
}