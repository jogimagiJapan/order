"use client";

import { ThreadColor } from "@/constants/colors";
import { useState, useEffect } from "react";

export default function ThreadSelector({
    limit,
    selected,
    colors,
    onToggle
}: {
    limit: number;
    selected: string[];
    colors: ThreadColor[];
    onToggle: (id: string, index?: number) => void;
}) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (activeIndex >= limit) {
            setActiveIndex(0);
        }
    }, [limit, activeIndex]);

    const handlePaletteClick = (colorId: string) => {
        onToggle(colorId, activeIndex);
        if (limit > 1) {
            setActiveIndex((prev) => (prev + 1) % limit);
        }
    };

    return (
        <div className="py-6">
            <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-[10px] font-black tracking-widest text-sub uppercase">Color Palette</span>
                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">{selected.filter(s => s).length} / {limit} Selected</span>
            </div>

            {colors.length > 0 ? (
                <div className="thread-grid mb-10">
                    {colors.map((color) => (
                        <div key={color.id} className="chip-container">
                            <div
                                className="color-chip-large"
                                style={{ backgroundColor: color.hex }}
                                onClick={() => handlePaletteClick(color.id)}
                            />
                            <span className="text-[10px] font-black mt-2 text-sub">
                                {color.id}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="thread-card text-center py-8 mb-10">
                    <p className="text-sm text-sub italic">表示可能な糸色がありません（マスタを確認してください）</p>
                </div>
            )}

            <div className="thread-slots">
                {Array.from({ length: limit }).map((_, i) => {
                    const colorId = selected[i];
                    const colorObj = colors.find(c => c.id === colorId);
                    const isActive = activeIndex === i;

                    return (
                        <div
                            key={i}
                            className={`slot-container ${isActive ? "active" : ""}`}
                            onClick={() => setActiveIndex(i)}
                        >
                            <span className="slot-label text-center">
                                {colorObj ? colorObj.name : `Thread ${i + 1}`}
                            </span>
                            {colorId ? (
                                <div className="flex flex-col items-center gap-1 animate-fade-in w-full">
                                    <div className="slot-chip mx-auto" style={{ backgroundColor: colorObj?.hex }} />
                                    <span className="slot-id text-center w-full">{colorId}</span>
                                </div>
                            ) : (
                                <div className="slot-placeholder">
                                    選択してください
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-[9px] text-sub text-center mt-8 font-bold uppercase tracking-widest opacity-60">
                タップしてスロットを選択し、上の色を選んでください
            </p>
        </div>
    );
}
