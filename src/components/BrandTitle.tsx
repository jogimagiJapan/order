export default function BrandTitle({ compact = false }: { compact?: boolean }) {
    const Tag = compact ? "div" : "h1";
    return (
        <Tag className={`brand-lockup ${compact ? "is-compact" : ""}`}>
            <span className="brand-jp">つむぐね</span>
            <span className="brand-en" aria-label="sew the sound">
                {Array.from("sew the sound").map((letter, index) => (
                    <span key={index} aria-hidden="true">
                        {letter === " " ? "\u00a0" : letter}
                    </span>
                ))}
            </span>
        </Tag>
    );
}
