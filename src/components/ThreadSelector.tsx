"use client";

import { THREAD_COLORS } from "@/constants/colors";

export default function ThreadSelector({
    limit,
    selected,
    onToggle
}: {
    limit: number;
    selected: string[];
    onToggle: (id: string) => void;
}) {
    return (
        <div className="py-6">
            <div className="flex justify-between items-center mb-8 px-2">
                <span className="text-[10px] font-black tracking-widest text-sub uppercase">Selected Colors</span>
                <span className="text-xs font-bold text-accent-gold">{selected.length} / {limit}</span>
            </div>

            <div className="thread-grid">
                {THREAD_COLORS.map((color) => {
                    const isActive = selected.includes(color.id);
                    return (
                        <div key={color.id} className="chip-container">
                            <div
                                className={`color-chip-large ${isActive ? "active" : ""}`}
                                style={{ backgroundColor: color.hex }}
                                onClick={() => onToggle(color.id)}
                            >
                                <span className="check">✓</span>
                            </div>
                            <span className={`text-[10px] font-bold mt-2 transition-colors ${isActive ? "text-text-main" : "text-sub"}`}>
                                {color.id}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-10 flex flex-wrap gap-2 justify-center">
                {selected.map(id => (
                    <div key={id} className="badge bg-white border border-border">
                        {THREAD_COLORS.find(c => c.id === id)?.name}
                    </div>
                ))}
            </div>
        </div>
    );
}
