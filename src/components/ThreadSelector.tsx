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
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="thread-card animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black tracking-widest text-accent-gold uppercase">Thread {i + 1}</span>
                        {values[i] && (
                            <span className="text-[10px] font-bold text-sub">
                                {THREAD_COLORS.find(c => c.id === values[i])?.name}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-5 gap-3 justify-center">
                        {THREAD_COLORS.map((color) => (
                            <div
                                key={color.id}
                                className={`chip-container ${values[i] === color.id ? "active" : ""}`}
                                onClick={() => onChange(i, color.id)}
                            >
                                <div
                                    className="color-chip"
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                                <span className="text-[8px] font-bold opacity-0 transition-opacity active:opacity-100">
                                    {color.id}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
