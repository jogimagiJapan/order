export const GPS_TEXT_MAX = 20;
export const GPS_OPTION_PRICE = 500;

/** Allowed: A-Z a-z 0-9 . , - _ */
const GPS_DISALLOWED = /[^A-Za-z0-9.,\-_]/g;

/**
 * YYYYMMDD_HHMMSS... → YYYY.MM.DD_HH.MM.SS (19 chars)
 */
export function formatGpsDatetimeFromId(selectedId: string): string {
    const m = String(selectedId || "").match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
    if (!m) return "";
    return `${m[1]}.${m[2]}.${m[3]}_${m[4]}.${m[5]}.${m[6]}`;
}

export function sanitizeGpsText(value: string): string {
    return String(value || "").replace(GPS_DISALLOWED, "").slice(0, GPS_TEXT_MAX);
}

export function isValidGpsText(value: string): boolean {
    if (!value || value.length > GPS_TEXT_MAX) return false;
    return !GPS_DISALLOWED.test(value);
}
