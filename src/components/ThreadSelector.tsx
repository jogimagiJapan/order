"use client";

import { THREAD_COLORS } from "@/constants/colors";

export default function ThreadSelector({
    count,
    values,
    onChange
}: {
    count: number;
    values: string[];
    onChange: (index: number, value: string) => void;
}) {
    return (
        <div className="grid gap-6">
            {[...Array(3)].map((_, i) => {
                const disabled = i >= count;
                return (
                    <div key={i} style={{ opacity: disabled ? 0.3 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
                        <p className="text-xs font-bold mb-2">THREAD {i + 1} {disabled && "(Disabled)"}</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {THREAD_COLORS.map((color) => (
                                <div
                                    key={color.id}
                                    className={`chip-container ${values[i] === color.id ? "active" : ""}`}
                                    onClick={() => !disabled && onChange(i, color.id)}
                                >
                                    <div
                                        className="color-chip"
                                        style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="text-[10px] font-bold">{color.id}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
