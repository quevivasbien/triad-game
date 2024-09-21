import { RealtimePresenceState } from "@supabase/supabase-js";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRotations(n: number) {
  return Array.from({ length: n }).map(_ => Math.round(Math.random() * 4 - 2));
}

  /**
   * Extracts values from a RealtimePresenceState object, given a list of keys to extract.
   * If any key is missing in a given entry, that entry is not included in the output.
   * If `uniqueOn` is provided, the values are filtered to be have all unique values of the specified uniqueOn key.
   * @param presenceState - The RealtimePresenceState to extract from.
   * @param keys - The keys to extract from the presence state.
   * @param uniqueOn - If provided, the values are filtered to be have all unique values of the specified uniqueOn key.
   * @returns An array of objects, each with the specified keys.
   */
export function extractValuesFromPresenceState(presenceState: RealtimePresenceState, keys: string[], uniqueOn?: string) {
  const values = Object.values(presenceState).flatMap((entry) => Object.values(entry)) as any[];
  const out: Record<string, any>[] = [];
  for (const value of values) {
    const entry: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in value) {
        entry[key] = value[key];
      }
    }
    if (Object.keys(entry).length === keys.length) {
      out.push(entry);
    }
  }
  if (uniqueOn) {
    const uniques = Array.from(new Set(out.map((entry) => entry[uniqueOn])));
    return uniques.map((x) => out[out.findIndex((entry) => entry[uniqueOn] === x)]);
  }
  return out;
}
