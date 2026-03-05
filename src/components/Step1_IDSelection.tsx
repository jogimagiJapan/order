"use client";
import { useState } from "react";

export default function Step1_IDSelection({
    files,
    onSelect,
    onNext,
    selectedId
}: {
    files: { fullName: string; friendlyId: string; url: string }[];
    onSelect: (id: string) => void;
    onNext: () => void;
    selectedId: string;
}) {
    const [manualId, setManualId] = useState("");

    const handleManualChange = (val: string) => {
        setManualId(val);
        onSelect(val);
    };

    return (
        <div className="animate-fade-in pb-20">
            <header className="mb-10 text-center">
                <h2 className="text-2xl mb-2 mt-6">01. Select ID</h2>
                <p className="text-sub">録音済みのファイルIDを選択してください</p>
            </header>

            <div className="grid gap-4 mb-8">
                <span className="text-[10px] font-black tracking-widest text-sub uppercase px-2 mb-1">Latest Files</span>
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
                            <span className="text-lg font-bold tracking-tight">{file.friendlyId}</span>
                        </div>
                    ))
                ) : (
                    <div className="thread-card text-center py-10">
                        <p className="text-sub italic">最新のファイルが見つかりません。</p>
                    </div>
                )}
            </div>

            <div className="mb-12">
                <span className="text-[10px] font-black tracking-widest text-sub uppercase px-2 mb-2 block">Manual Entry</span>
                <input
                    type="text"
                    className="w-full p-4 bg-white border border-border rounded-xl text-lg font-bold tracking-tight focus:border-text-main outline-none transition-all placeholder:font-normal placeholder:text-sm"
                    placeholder="IDを手動入力 (例: 123AB)"
                    value={manualId || (files.some(f => f.friendlyId === selectedId) ? "" : selectedId)}
                    onChange={(e) => handleManualChange(e.target.value.toUpperCase())}
                />
            </div>

            {selectedId && (
                <div className="flex justify-center animate-fade-in">
                    <button
                        className="submit-btn"
                        onClick={() => onNext()}
                    >
                        CONTINUE →
                    </button>
                </div>
            )}
        </div>
    );
}
