import { RealtimePresenceState } from "@supabase/supabase-js";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Computes the Cartesian product of the given arrays.
 * @param args The arrays to take the product of.
 * @returns An array of arrays, where each inner array is an element of the Cartesian product.
 * @example
 * product([1, 2], ['a', 'b']) // [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
 */
export function product(...args: any[][]): any[][] {
  return args.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
}

/**
 * Randomly samples n elements from the given array, with replacement.
 * @param arr The array to sample from.
 * @param n The number of elements to sample.
 * @returns An array of n elements, randomly sampled from the input array.
 * @example
 * sample([1, 2, 3], 2) // [1, 3]
 */
export function sample<T>(arr: T[], n: number) {
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[Math.floor(Math.random() * arr.length)]);
  }
  return out;
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
