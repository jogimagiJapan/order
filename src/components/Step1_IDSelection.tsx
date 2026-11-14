import { useState } from "react";
import { parseDisplayId } from "@/utils/id";
import { StepHeader } from "./FormHeadings";

function DisplayId({ id }: { id: string }) {
    const { time, username } = parseDisplayId(id);
    return (
        <span className="id-display">
            <span className="id-time">{time}</span>
            {username && <span className="id-user">{username}</span>}
        </span>
    );
}

export default function Step1_IDSelection({
    files,
    onSelect,
    onNext,
    selectedId,
    fromQR = false,
}: {
    files: { fullName: string; friendlyId: string; url: string; displayId?: string }[];
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
        <>
            <div className="animate-fade-in step1-body">
                <StepHeader index="01" title="Select ID" lead="録音済みのファイルIDを選択してください" />

                {fromQR && selectedId && (
                    <div className="id-group">
                        <span className="field-label">QR読み取り済み</span>
                        <div className="tile id-tile active" style={{ cursor: "default" }}>
                            <DisplayId id={selectedId} />
                        </div>
                    </div>
                )}

                <div className="id-group">
                    <span className="field-label">最新のファイル<span className="field-label-en">Latest Files</span></span>
                    {files.length > 0 ? (
                        files.map((file) => (
                            <div
                                key={file.friendlyId}
                                className={`tile id-tile ${!fromQR && selectedId === file.friendlyId ? "active" : ""}`}
                                onClick={() => {
                                    setManualId("");
                                    onSelect(file.friendlyId); // Passes FULL ID
                                }}
                            >
                                <DisplayId id={file.friendlyId} />
                            </div>
                        ))
                    ) : (
                        <div className="tile is-disabled">
                            <span className="tile-note">最新のファイルが見つかりません</span>
                        </div>
                    )}
                </div>

                <div className="id-group">
                    <span className="field-label">ID入力<span className="field-label-en">Manual</span></span>
                    <textarea
                        rows={3}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-form-type="other"
                        className={`id-input ${isManuallyEntered ? "is-active" : ""}`}
                        placeholder="20250714_164445_name"
                        value={manualId || (isManuallyEntered ? selectedId : "")}
                        onChange={(e) => handleManualChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="sticky-cta animate-fade-in">
                <button
                    type="button"
                    className="btn-primary"
                    disabled={!selectedId}
                    onClick={() => selectedId && onNext()}
                >
                    このIDで進む
                </button>
            </div>
        </>
    );
}
