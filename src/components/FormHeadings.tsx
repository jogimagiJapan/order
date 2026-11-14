export function StepHeader({ index, title, lead }: { index: string; title: string; lead: string }) {
    return (
        <header className="step-header">
            <span className="step-index">STEP {index}</span>
            <h2 className="step-title">{title}</h2>
            <p className="step-lead">{lead}</p>
        </header>
    );
}

export function SectionTitle({
    num,
    label,
    en,
    optional = false,
}: {
    num: number;
    label: string;
    en: string;
    optional?: boolean;
}) {
    return (
        <h3 className="section-title">
            <span className="section-num">{String(num).padStart(2, "0")}</span>
            <span className="section-label">{label}</span>
            {optional && <span className="section-optional">任意</span>}
            <span className="section-en">{en}</span>
        </h3>
    );
}
