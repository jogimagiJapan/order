"use client";

import { Plan, MasterDataItem, OrderState } from "@/hooks/useOrderForm";
import ThreadSelector from "./ThreadSelector";
import { useEffect, useRef } from "react";

export default function Step2_DetailsSelection({
    order,
    masterData,
    onUpdate
}: {
    order: OrderState;
    masterData: { items: MasterDataItem[]; colors: MasterDataItem[]; sizes: MasterDataItem[] };
    onUpdate: (updates: Partial<OrderState>) => void;
}) {
    const plansRef = useRef<HTMLElement>(null);
    const itemsRef = useRef<HTMLElement>(null);
    const colorSizeRef = useRef<HTMLDivElement>(null);
    const threadsRef = useRef<HTMLElement>(null);
    const remarksRef = useRef<HTMLElement>(null);

    const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    };

    // Auto-scroll logic
    useEffect(() => {
        if (order.plan && !order.item) scrollTo(itemsRef);
    }, [order.plan, order.item]);

    useEffect(() => {
        if (order.item && (!order.itemColor || !order.itemSize)) scrollTo(colorSizeRef);
    }, [order.item, order.itemColor, order.itemSize]);

    useEffect(() => {
        if (order.itemColor && order.itemSize && order.threads.every(t => !t)) scrollTo(threadsRef);
    }, [order.itemColor, order.itemSize, order.threads]);

    // Note: Not scrolling to remarks automatically as users might want to review threads

    const plans: { id: Plan; label: string; price: string }[] = [
        { id: "Lite", label: "Lite", price: "¥2,000" },
        { id: "Standard", label: "Standard", price: "¥4,000" },
        { id: "Limited", label: "Limited", price: "¥2,000" },
    ];

    // Filter logic
    const filteredColors = masterData.colors.filter(c =>
        c.associatedItems.length === 0 || (order.item && c.associatedItems.includes(order.item))
    );
    const filteredSizes = masterData.sizes.filter(s =>
        s.associatedItems.length === 0 || (order.item && s.associatedItems.includes(order.item))
    );

    // Auto-fill logic
    useEffect(() => {
        const updates: Partial<OrderState> = {};
        if (masterData.items.length === 1 && !order.item) {
            updates.item = masterData.items[0].name;
        }

        // If item is selected, check filtered colors/sizes
        if (order.item) {
            const currentItemColors = masterData.colors.filter(c =>
                c.associatedItems.length === 0 || c.associatedItems.includes(order.item)
            );
            const currentItemSizes = masterData.sizes.filter(s =>
                s.associatedItems.length === 0 || s.associatedItems.includes(order.item)
            );

            if (currentItemColors.length === 1 && !order.itemColor) {
                updates.itemColor = currentItemColors[0].name;
            }
            if (currentItemSizes.length === 1 && !order.itemSize) {
                updates.itemSize = currentItemSizes[0].name;
            }
        }

        if (Object.keys(updates).length > 0) {
            onUpdate(updates);
        }
    }, [masterData, order.item, order.itemColor, order.itemSize, onUpdate]);

    const handleThreadToggle = (id: string, index?: number) => {
        const count = order.plan === "Lite" ? 1 : 3;
        const newThreads = [...order.threads];

        // Ensure array is of correct length
        while (newThreads.length < count) newThreads.push("");

        if (index !== undefined && index < count) {
            newThreads[index] = id;
            onUpdate({ threads: newThreads });
        }
    };

    const threadCount = order.plan === "Lite" ? 1 : 3;

    return (
        <div className="animate-fade-in pb-20">
            <header className="mb-10 text-center">
                <h2 className="text-2xl mb-2 mt-6">02. Customize</h2>
                <p className="text-sub">デザインと詳細を選択してください</p>
            </header>

            <section className="mb-16" ref={plansRef}>
                <h3 className="section-title">02-1. SELECT PLAN</h3>
                <div className="grid grid-3">
                    {plans.map((p) => (
                        <div
                            key={p.id}
                            className={`tile ${order.plan === p.id ? "active" : ""}`}
                            onClick={() => {
                                // Reset threads if plan changes
                                const limit = p.id === "Lite" ? 1 : 3;
                                let newThreads = order.threads.slice(0, limit);
                                while (newThreads.length < limit) newThreads.push("");
                                onUpdate({ plan: p.id, threads: newThreads });
                            }}
                        >
                            <span className="text-xs font-bold tracking-widest">{p.label}</span>
                            <span className="text-[10px] mt-1 opacity-60">{p.price}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-16" ref={itemsRef}>
                <h3 className="section-title">02-2. SELECT ITEM</h3>
                <div className="grid grid-2">
                    {masterData.items.map((item) => (
                        <div
                            key={item.name}
                            className={`tile ${order.item === item.name ? "active" : ""}`}
                            onClick={() => {
                                onUpdate({
                                    item: item.name,
                                    itemColor: "",
                                    itemSize: ""
                                });
                            }}
                        >
                            <span className="text-sm font-bold">{item.name}</span>
                            <span className="text-[10px] mt-1 opacity-60">+¥{item.price.toLocaleString()}</span>
                            {masterData.items.length === 1 && <span className="badge">Auto-Selected</span>}
                        </div>
                    ))}
                </div>
            </section>

            <div className="mb-16" ref={colorSizeRef}>
                <section className="mb-10">
                    <h3 className="section-title">02-3. COLOR</h3>
                    <div className="grid grid-2">
                        {!order.item ? (
                            <div className="tile opacity-30 cursor-not-allowed border-none shadow-none">
                                <span className="text-[10px] italic">Select item first</span>
                            </div>
                        ) : filteredColors.length > 0 ? (
                            filteredColors.map((c) => (
                                <div
                                    key={c.name}
                                    className={`tile ${order.itemColor === c.name ? "active" : ""}`}
                                    onClick={() => onUpdate({ itemColor: c.name })}
                                >
                                    <span className="text-sm font-bold">{c.name}</span>
                                    {filteredColors.length === 1 && <span className="badge">Auto-Selected</span>}
                                </div>
                            ))
                        ) : (
                            <div className="tile opacity-30 cursor-not-allowed border-none shadow-none">
                                <span className="text-[10px] italic">No colors</span>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h3 className="section-title">02-4. SIZE</h3>
                    <div className="grid grid-2">
                        {!order.item ? (
                            <div className="tile opacity-30 cursor-not-allowed border-none shadow-none">
                                <span className="text-[10px] italic">Select item first</span>
                            </div>
                        ) : filteredSizes.length > 0 ? (
                            filteredSizes.map((s) => (
                                <div
                                    key={s.name}
                                    className={`tile ${order.itemSize === s.name ? "active" : ""}`}
                                    onClick={() => onUpdate({ itemSize: s.name })}
                                >
                                    <span className="text-sm font-bold">{s.name}</span>
                                    {filteredSizes.length === 1 && <span className="badge">Auto-Selected</span>}
                                </div>
                            ))
                        ) : (
                            <div className="tile opacity-30 cursor-not-allowed border-none shadow-none">
                                <span className="text-[10px] italic">No sizes</span>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <section className="mb-16" ref={threadsRef}>
                <h3 className="section-title">02-5. THREAD COLORS</h3>
                {order.plan ? (
                    <ThreadSelector
                        limit={threadCount}
                        selected={order.threads}
                        onToggle={handleThreadToggle}
                    />
                ) : (
                    <div className="thread-card text-center py-10">
                        <p className="text-sm text-sub italic">Please select a plan first to choose threads.</p>
                    </div>
                )}
            </section>

            <section ref={remarksRef}>
                <h3 className="section-title">02-6. REMARKS (OPTIONAL)</h3>
                <textarea
                    className="w-full min-h-[120px] resize-none text-sm"
                    placeholder="ご要望や特記事項があればご記入ください"
                    value={order.notes}
                    onChange={(e) => onUpdate({ notes: e.target.value })}
                />
            </section>
        </div>
    );
}
