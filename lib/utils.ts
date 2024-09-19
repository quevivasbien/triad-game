import { RealtimePresenceState } from "@supabase/supabase-js";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractValuesFromPresenceState(presenceState: RealtimePresenceState, keys: string[]) {
  const values = Object.values(presenceState).flatMap((entry) => Object.values(entry)) as any[];
  const out = [];
  for (const value of values) {
    const entry: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in value) {
        entry[key] = value[key];
      }
    }
    if (Object.keys(entry).length > 0) {
      out.push(entry);
    }
  }
  return out;
}