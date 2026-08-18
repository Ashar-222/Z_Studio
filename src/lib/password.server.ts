/**
 * Server-side leaked-password protection.
 *
 * Checks a candidate password against the HaveIBeenPwned "Pwned Passwords"
 * range API using k-anonymity: only the first 5 characters of the SHA-1 hash
 * ever leave the server, never the password itself.
 */
export async function isPasswordLeaked(password: string): Promise<boolean> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return false;
    const body = await res.text();
    return body
      .split("\n")
      .some((line) => line.split(":")[0]?.trim().toUpperCase() === suffix);
  } catch {
    // Never block sign-up on an outage of the external breach database.
    return false;
  }
}
