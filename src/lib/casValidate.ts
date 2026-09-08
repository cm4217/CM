/** CAS RN checksum — client-safe (no node:fs). */
export function isValidCas(cas?: string): boolean {
  if (!cas) return false;
  const m = String(cas).trim().match(/^(\d{2,7})-(\d{2})-(\d)$/);
  if (!m) return false;
  const digits = (m[1] + m[2]).split("").reverse().map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += digits[i] * (i + 1);
  return sum % 10 === Number(m[3]);
}
