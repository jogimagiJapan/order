/**
 * ID Processing Utilities
 * Ensures raw data integrity while providing clean presentation labels.
 */

/**
 * Strips the date prefix for UI display.
 * Example: "20260319_005608_test" → "005608_test"
 * Maintains raw string if format doesn't match YYYYMMDD_
 */
export function formatDisplayId(id: string): string {
    const parts = id.split("_");
    // Check if the first part is exactly 8 digits (YYYYMMDD)
    if (parts.length >= 3 && /^\d{8}$/.test(parts[0])) {
        return parts.slice(1).join("_");
    }
    return id;
}
