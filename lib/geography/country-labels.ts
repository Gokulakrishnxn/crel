/** ISO 3166-1 alpha-2 → display name */
export function getCountryName(code: string): string {
  const normalized = code?.trim().toUpperCase();
  if (!normalized || normalized === "UNKNOWN") return "Unknown";

  if (normalized.length !== 2) return code;

  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(normalized);
    return name ?? normalized;
  } catch {
    return normalized;
  }
}

/** Regional indicator symbol flag from ISO2 (e.g. US → 🇺🇸) */
export function getCountryFlag(code: string): string {
  const normalized = code?.trim().toUpperCase();
  if (!normalized || normalized.length !== 2) return "🌍";

  return String.fromCodePoint(
    ...normalized.split("").map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  );
}

export function toMapCountryCode(code: string): string | null {
  const normalized = code?.trim().toLowerCase();
  if (!normalized || normalized === "unknown" || normalized.length !== 2) return null;
  return normalized;
}
