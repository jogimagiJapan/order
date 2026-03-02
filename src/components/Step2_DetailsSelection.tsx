"use client";

import { Plan, MasterDataItem, OrderState } from "@/hooks/useOrderForm";
import ThreadSelector from "./ThreadSelector";
import { useEffect } from "react";

export default function Step2_DetailsSelection({
    order,
    masterData,
    onUpdate
}: {
    order: OrderState;
    masterData: { items: MasterDataItem[]; colors: MasterDataItem[]; sizes: MasterDataItem[] };
    onUpdate: (updates: Partial<OrderState>) => void;
}) {
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

    const handleThreadChange = (index: number, value: string) => {
        const key = `thread${index + 1}` as keyof OrderState;
        onUpdate({ [key]: value });
    };

    const threadCount = order.plan === "Lite" ? 1 : 3;

    return (
        <div className="animate-fade-in pb-10">
            <h2 className="mb-4 text-center">Step 02: Customize</h2>

            <section className="mb-8">
                <h3 className="section-title mb-2 text-xs font-bold text-sub">02-1. SELECT PLAN</h3>
                <div className="grid grid-3">
                    {plans.map((p) => (
                        <div
                            key={p.id}
                            className={`tile ${order.plan === p.id ? "active" : ""}`}
                            onClick={() => onUpdate({ plan: p.id })}
                        >
                            <span className="text-sm font-bold">{p.label}</span>
                            <span className="text-[10px] opacity-70">{p.price}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-8">
                <h3 className="section-title mb-2 text-xs font-bold text-sub">02-2. SELECT ITEM</h3>
                <div className="grid grid-2">
                    {masterData.items.map((item) => (
                        <div
                            key={item.name}
                            className={`tile ${order.item === item.name ? "active" : ""}`}
                            onClick={() => {
                                // Reset color/size when item changes
                                onUpdate({
                                    item: item.name,
                                    itemColor: "",
                                    itemSize: ""
                                });
                            }}
                        >
                            <span className="text-sm font-bold">{item.name}</span>
                            <span className="text-[10px] opacity-70">+¥{item.price.toLocaleString()}</span>
                            {masterData.items.length === 1 && <span className="badge">Auto-Selected</span>}
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-2 mb-8">
                <section>
                    <h3 className="section-title mb-2 text-xs font-bold text-sub">02-3. COLOR</h3>
                    <div className="grid">
                        {!order.item ? (
                            <p className="text-[10px] text-sub italic">Select item first</p>
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
                            <p className="text-[10px] text-sub italic">No colors available</p>
                        )}
                    </div>
                </section>

                <section>
                    <h3 className="section-title mb-2 text-xs font-bold text-sub">02-4. SIZE</h3>
                    <div className="grid">
                        {!order.item ? (
                            <p className="text-[10px] text-sub italic">Select item first</p>
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
                            <p className="text-[10px] text-sub italic">No sizes available</p>
                        )}
                    </div>
                </section>
            </div>

            <section className="mb-8">
                <h3 className="section-title mb-2 text-xs font-bold text-sub">02-5. THREAD COLORS</h3>
                {order.plan ? (
                    <ThreadSelector
                        count={threadCount}
                        values={[order.thread1, order.thread2, order.thread3]}
                        onChange={handleThreadChange}
                    />
                ) : (
                    <p className="text-center text-sub italic">Please select a plan first.</p>
                )}
            </section>

            <section>
                <h3 className="section-title mb-2 text-xs font-bold text-sub">02-6. REMARKS (OPTIONAL)</h3>
                <textarea
                    className="w-full p-4 border rounded-xl outline-none focus:border-primary transition-colors text-sm"
                    rows={3}
                    placeholder="ご要望があればご記入ください"
                    value={order.notes}
                    onChange={(e) => onUpdate({ notes: e.target.value })}
                />
            </section>
        </div>
    );
}
