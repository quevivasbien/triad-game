import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
): never {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}


  /**
   * Converts a time in seconds to a string in the format HH:MM:SS, or MM:SS if less than 1 hour.
   * @param {number} time - The time in seconds to convert.
   * @returns {string} The time as a string in the format HH:MM:SS or MM:SS.
   */
export function secondsToTimeString(time: number): string {
  const seconds = time % 60;
  const minutes = Math.floor(time / 60) % 60;
  const hours = Math.floor(time / 3600);
  const timeString = hours > 0 ? (
      `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  ) : (
      `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  );
  return timeString;
}