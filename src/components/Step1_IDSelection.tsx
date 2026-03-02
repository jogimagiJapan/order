"use client";

export default function Step1_IDSelection({
    files,
    onSelect,
    selectedId
}: {
    files: { fullName: string; friendlyId: string; url: string }[];
    onSelect: (id: string) => void;
    selectedId: string;
}) {
    return (
        <div className="animate-fade-in">
            <h2 className="mb-4 text-center">Step 01: Select ID</h2>
            <p className="text-sub text-center mb-6">録音されたファイルから自分のIDを選択してください。</p>
            <div className="grid">
                {files.length > 0 ? (
                    files.map((file) => (
                        <div
                            key={file.friendlyId}
                            className={`tile ${selectedId === file.friendlyId ? "active" : ""}`}
                            onClick={() => onSelect(file.friendlyId)}
                        >
                            <span className="font-bold">{file.friendlyId}</span>
                            <span className="text-xs opacity-70">{file.fullName}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sub">最新のファイルが見つかりません。</p>
                )}
            </div>
        </div>
    );
}
