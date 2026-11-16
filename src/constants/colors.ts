export interface ThreadColor {
    id: string;
    hex: string;
    name: string;
    special?: boolean;
    label?: string;
}

/** Fixed A–L mapping (fallback for admin / missing master rows). */
export const THREAD_COLORS: ThreadColor[] = [
    { id: "A", hex: "#ffffff", name: "White" },
    { id: "B", hex: "#212322", name: "Black" },
    { id: "C", hex: "#847f87", name: "Gray" },
    { id: "D", hex: "#006aad", name: "Blue" },
    { id: "E", hex: "#8ec5bd", name: "Light Blue" },
    { id: "F", hex: "#007a3e", name: "Green" },
    { id: "G", hex: "#b1d0a2", name: "Pale Green" },
    { id: "H", hex: "#d50032", name: "Red" },
    { id: "I", hex: "#f79fba", name: "Pink" },
    { id: "J", hex: "#e35205", name: "Orange" },
    { id: "K", hex: "#f7e200", name: "Yellow" },
    { id: "L", hex: "#823b34", name: "Brown" },
];

export interface MasterThreadItem {
    name: string;
    note?: string;
    associatedItems: string[];
}

export interface ThreadColorOption extends ThreadColor {
    visible: boolean;
}

/**
 * Parse master ThreadColor row.
 * 備考 = `#hex|Name|Label`（Label は任意）, 対象アイテム = 表示 / 非表示 / イベント.
 */
export function parseThreadColorItem(item: MasterThreadItem): ThreadColorOption {
    const fallback = THREAD_COLORS.find(c => c.id === item.name);
    const note = String(item.note || "");
    const [hexPart, namePart, ...labelParts] = note.split("|").map(part => part.trim());
    const hex = hexPart && hexPart.startsWith("#") ? hexPart : (fallback?.hex || "#cccccc");
    const name = namePart || fallback?.name || String(item.name);
    const special = item.associatedItems.includes("イベント");
    const labelText = labelParts.join("|").trim();
    return {
        id: String(item.name),
        hex,
        name,
        special,
        label: labelText || undefined,
        visible: special || item.associatedItems.includes("表示"),
    };
}

function toThreadColor({ id, hex, name, special, label }: ThreadColorOption): ThreadColor {
    return { id, hex, name, special, label };
}

export function getVisibleThreadColors(masterThreads: MasterThreadItem[]): ThreadColor[] {
    if (!masterThreads.length) {
        return THREAD_COLORS;
    }
    return masterThreads
        .map(parseThreadColorItem)
        .filter(c => c.visible)
        .map(toThreadColor);
}

export function resolveThreadColor(
    id: string,
    masterThreads: MasterThreadItem[] = [],
): ThreadColor | undefined {
    const fromMaster = masterThreads.map(parseThreadColorItem).find(c => c.id === id);
    if (fromMaster) {
        return toThreadColor(fromMaster);
    }
    return THREAD_COLORS.find(c => c.id === id);
}
