"use client";
import { useState } from "react";

/** Strip date prefix from IDs like "20260305_171923_name" → "171923_name" */
function formatDisplayId(id: string): string {
    const parts = id.split("_");
    // If format is YYYYMMDD_HHMMSS_name, remove the first segment (date)
    if (parts.length >= 3 && /^\d{8}$/.test(parts[0])) {
        return parts.slice(1).join("_");
    }
    return id;
}

export default function Step1_IDSelection({
    files,
    onSelect,
    onNext,
    selectedId,
    fromQR = false,
}: {
    files: { fullName: string; friendlyId: string; url: string }[];
    onSelect: (id: string) => void;
    onNext: () => void;
    selectedId: string;
    fromQR?: boolean;
}) {
    const [manualId, setManualId] = useState("");

    const handleManualChange = (val: string) => {
        // Strip spaces and force uppercase
        const cleaned = val.replace(/\s/g, "").toUpperCase();
        setManualId(cleaned);
        onSelect(cleaned);
    };

    // Determine if a file tile is selected (vs manually entered)
    const isFileTileSelected = files.some(f => f.friendlyId === selectedId);
    // Display value for manual input: show formatted ID if QR-filled, else raw manualId
    const manualDisplayValue = manualId || (!isFileTileSelected && selectedId ? selectedId : "");

    return (
        <div className="animate-fade-in pb-20">
            <header className="mb-10 text-center">
                <h2 className="text-2xl mb-2 mt-6">01. Select ID</h2>
                <p className="text-sub">録音済みのファイルIDを選択してください</p>
            </header>

            {/* Manual Entry — displayed first, same tile-style padding */}
            <div className="mb-6">
                <span className="text-[10px] font-black tracking-widest text-sub uppercase px-1 mb-2 block">
                    Manual Entry
                </span>
                <div className={`relative transition-all duration-200 ${!isFileTileSelected && selectedId ? "ring-2 ring-[#4f7ef8] rounded-xl" : ""}`}>
                    <input
                        type="text"
                        inputMode="none"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="w-full px-4 py-5 bg-white border border-border rounded-xl text-lg font-bold tracking-tight focus:border-[#4f7ef8] outline-none transition-all"
                        placeholder="IDを手動入力 (例: 20260305_171923_name)"
                        value={manualDisplayValue}
                        onChange={(e) => handleManualChange(e.target.value)}
                    />
                    {!isFileTileSelected && selectedId && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-[#4f7ef8] uppercase">
                            {fromQR ? "QR" : "✓"}
                        </span>
                    )}
                </div>
                {/* Formatted preview when QR-filled */}
                {fromQR && selectedId && (
                    <p className="text-[10px] text-[#4f7ef8] font-bold mt-2 px-1 tracking-wide animate-fade-in">
                        QR読み取り済 → {formatDisplayId(selectedId)}
                    </p>
                )}
            </div>

            {/* Latest Files */}
            <div className="grid gap-4 mb-10">
                <span className="text-[10px] font-black tracking-widest text-sub uppercase px-1 mb-1">
                    Latest Files
                </span>
                {files.length > 0 ? (
                    files.map((file) => (
                        <div
                            key={file.friendlyId}
                            className={`tile ${selectedId === file.friendlyId ? "active" : ""}`}
                            onClick={() => {
                                setManualId("");
                                onSelect(file.friendlyId);
                            }}
                        >
                            <span className="text-lg font-bold tracking-tight">
                                {formatDisplayId(file.friendlyId)}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="thread-card text-center py-10">
                        <p className="text-sub italic">最新のファイルが見つかりません。</p>
                    </div>
                )}
            </div>

            {selectedId && (
                <div className="flex justify-center animate-fade-in">
                    <button
                        className="submit-btn"
                        style={fromQR ? {
                            backgroundColor: "#4f7ef8",
                            borderColor: "#4f7ef8",
                            color: "#fff",
                            boxShadow: "0 8px 24px rgba(79, 126, 248, 0.4)",
                        } : {}}
                        onClick={() => onNext()}
                    >
                        {fromQR ? "QR ID 確認 →" : "CONTINUE →"}
                    </button>
                </div>
            )}
        </div>
    );
}
