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

    const filledCount = selected.filter(s => s).length;

    const handlePaletteClick = (colorId: string) => {
        onToggle(colorId, activeIndex);
        if (limit > 1) {
            setActiveIndex((prev) => (prev + 1) % limit);
        }
    };

    return (
        <div className="thread-selector">
            <div className="thread-palette-head">
                <span className="thread-palette-label">パレットから色を選択</span>
                <span className={`thread-count ${filledCount === limit ? "is-complete" : ""}`}>{filledCount} / {limit}</span>
            </div>

            {colors.length > 0 ? (
                <div className="thread-grid">
                    {colors.map((color) => (
                        <div key={color.id} className="chip-container">
                            <div
                                className="color-chip-large"
                                style={{ backgroundColor: color.hex }}
                                onClick={() => handlePaletteClick(color.id)}
                            />
                            <span className="chip-id">{color.id}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="tile is-disabled">
                    <span className="tile-note">表示可能な糸色がありません（マスタを確認してください）</span>
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
                                {colorObj ? colorObj.name : `糸 ${i + 1}`}
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

            <p className="thread-help">
                タップしてスロットを選択し、上の色を選んでください
            </p>
        </div>
    );
}
