"use client";
import { useState } from "react";

/** Strip date prefix: "20260305_171923_name" → "171923_name" */
function formatDisplayId(id: string): string {
    const parts = id.split("_");
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
        // Remove all whitespace to prevent autocomplete artifacts
        const cleaned = val.replace(/\s/g, "");
        setManualId(cleaned);
        onSelect(cleaned);
    };

    const isFileTileSelected = files.some(f => f.friendlyId === selectedId);
    const isManuallyEntered = !isFileTileSelected && !!selectedId && !fromQR;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: "110px" }}>
            <header className="mb-10 text-center">
                <h2 className="text-2xl mb-2 mt-6">01. Select ID</h2>
                <p className="text-sub">録音済みのファイルIDを選択してください</p>
            </header>

            {/* QR Pre-filled tile */}
            {fromQR && selectedId && (
                <div className="mb-6">
                    <span className="text-[10px] font-black tracking-widest text-sub uppercase px-1 mb-2 block">
                        QR読み取り済み
                    </span>
                    <div className="tile active" style={{ cursor: "default" }}>
                        <span className="text-lg font-bold tracking-tight">
                            {formatDisplayId(selectedId)}
                        </span>
                    </div>
                </div>
            )}

            {/* Latest Files List */}
            <div className="grid gap-4 mb-8">
                <span className="text-[10px] font-black tracking-widest text-sub uppercase px-1 mb-1">
                    Latest Files
                </span>
                {files.length > 0 ? (
                    files.map((file) => (
                        <div
                            key={file.friendlyId}
                            className={`tile ${!fromQR && selectedId === file.friendlyId ? "active" : ""}`}
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

            {/* ID入力 — manual entry at bottom of list */}
            <div className="mb-4">
                <span className="text-[10px] font-black tracking-widest text-sub uppercase px-1 mb-2 block">
                    ID入力
                </span>
                <textarea
                    rows={3}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-form-type="other"
                    className={`w-full px-4 py-4 bg-white border rounded-xl text-base font-bold tracking-tight outline-none transition-all resize-none font-mono ${isManuallyEntered ? "border-[#4f7ef8] ring-1 ring-[#4f7ef8]" : "border-border"}`}
                    placeholder="20250714_164445_name"
                    value={manualId || (isManuallyEntered ? selectedId : "")}
                    onChange={(e) => handleManualChange(e.target.value)}
                />
            </div>

            {/* Sticky confirm button */}
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px 20px",
                    background: "linear-gradient(to top, var(--base-bg) 75%, transparent)",
                    zIndex: 50,
                }}
            >
                <button
                    className="submit-btn w-full"
                    disabled={!selectedId}
                    style={selectedId ? {
                        backgroundColor: "#f97316",
                        borderColor: "#f97316",
                        color: "#fff",
                        boxShadow: "0 8px 24px rgba(249, 115, 22, 0.35)",
                        opacity: 1,
                    } : { opacity: 0.3, cursor: "not-allowed" }}
                    onClick={() => selectedId && onNext()}
                >
                    このIDで進む
                </button>
            </div>
        </div>
    );
}
