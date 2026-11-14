export type Plan = "LITE" | "LIMITED" | "WAVE" | "CIRCLE";

export const PLANS: { id: Plan; price: number }[] = [
    { id: "LITE", price: 2000 },
    { id: "LIMITED", price: 2000 },
    { id: "WAVE", price: 4000 },
    { id: "CIRCLE", price: 4000 },
];

const PLAN_ALIASES: Record<string, Plan> = {
    lite: "LITE",
    limited: "LIMITED",
    wave: "WAVE",
    stdwave: "WAVE",
    circle: "CIRCLE",
    stdcircle: "CIRCLE",
};

/** 旧表記（Lite / Std Wave など）も現在のプラン名に揃える */
export function normalizePlan(value: unknown): Plan | null {
    const key = String(value ?? "").toLowerCase().replace(/[\s_-]/g, "");
    return PLAN_ALIASES[key] ?? null;
}

/** 表示用。未知の値はそのまま返す */
export function formatPlan(value: unknown): string {
    return normalizePlan(value) ?? String(value ?? "");
}

export function planPrice(plan: Plan | null): number {
    return PLANS.find(p => p.id === plan)?.price ?? 0;
}

export function threadLimitFor(plan: unknown): number {
    return normalizePlan(plan) === "LITE" ? 1 : 3;
}
