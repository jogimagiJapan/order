"use client";

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
    return (
        <div className="animate-fade-in pb-20">
            <header className="mb-10 text-center">
                <h2 className="text-2xl mb-2 mt-6">01. Select ID</h2>
                <p className="text-sub">録音済みのファイルIDを選択してください</p>
            </header>

            <div className="grid gap-4 mb-10">
                {files.length > 0 ? (
                    files.map((file) => (
                        <div
                            key={file.friendlyId}
                            className={`tile ${selectedId === file.friendlyId ? "active" : ""}`}
                            onClick={() => onSelect(file.friendlyId)}
                        >
                            <span className="text-lg font-bold tracking-tight">{file.friendlyId}</span>
                        </div>
                    ))
                ) : (
                    <div className="thread-card text-center py-20">
                        <p className="text-sub italic">最新のファイルが見つかりません。</p>
                        <p className="text-[10px] mt-2 opacity-50">しばらくしてから再度お試しください</p>
                    </div>
                )}
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
