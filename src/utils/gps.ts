export const GPS_TEXT_MAX = 20;
export const GPS_OPTION_PRICE = 500;

/** Allowed after sanitize: A–Z 0–9 . , - _ : / and half-width space */
const GPS_DISALLOWED = /[^A-Z0-9.,\-_:\/ ]/g;

const MONTH_ABBR = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

/**
 * YYYYMMDD_HHMMSS... → 17NOV2026_132456
 */
export function formatGpsDatetimeFromId(selectedId: string): string {
    const m = String(selectedId || "").match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
    if (!m) return "";
    const monthIndex = Number(m[2]) - 1;
    const month = MONTH_ABBR[monthIndex];
    if (!month) return "";
    return `${m[3]}${month}${m[1]}_${m[4]}${m[5]}${m[6]}`;
}

export function sanitizeGpsText(value: string): string {
    return String(value || "")
        .replace(/：/g, ":")
        .replace(/　/g, " ")
        .toUpperCase()
        .replace(GPS_DISALLOWED, "")
        .slice(0, GPS_TEXT_MAX);
}

export function isValidGpsText(value: string): boolean {
    if (!value || !value.trim() || value.length > GPS_TEXT_MAX) return false;
    return !/[^A-Z0-9.,\-_:\/ ]/.test(value);
}
