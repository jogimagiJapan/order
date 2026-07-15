/**
 * ID Processing Utilities
 * Ensures raw data integrity while providing clean presentation labels.
 */

export interface DisplayIdParts {
    time: string;
    username: string;
}

/**
 * Splits ID into time and username for two-line display.
 * Example: "20260319_005608_test" → { time: "005608", username: "test" }
 * Falls back to full string as time if format doesn't match.
 */
export function parseDisplayId(id: string): DisplayIdParts {
    const parts = id.split("_");
    // YYYYMMDD_HHMMSS_username
    if (parts.length >= 3 && /^\d{8}$/.test(parts[0])) {
        return {
            time: parts[1],
            username: parts.slice(2).join("_"),
        };
    }
    // HHMMSS_username (already stripped of date)
    if (parts.length >= 2 && /^\d{6}$/.test(parts[0])) {
        return {
            time: parts[0],
            username: parts.slice(1).join("_"),
        };
    }
    return { time: id, username: "" };
}

/**
 * Strips the date prefix for UI display.
 * Example: "20260319_005608_test" → "005608_test"
 * Maintains raw string if format doesn't match YYYYMMDD_
 */
export function formatDisplayId(id: string): string {
    const { time, username } = parseDisplayId(id);
    return username ? `${time}_${username}` : time;
}
