"use client";

import { OrderState } from "@/hooks/useOrderForm";
import { THREAD_COLORS } from "@/constants/colors";

export default function Step3_Preview({
    order,
    isSubmitting,
    onSubmit
}: {
    order: OrderState;
    isSubmitting: boolean;
    onSubmit: () => void;
}) {
    const getThreadColor = (id: string) => THREAD_COLORS.find(c => c.id === id);

    const SummaryItem = ({ label, value }: { label: string; value: string }) => (
        <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
            <span className="text-[9px] font-black tracking-widest text-sub uppercase">{label}</span>
            <span className="text-xs font-bold">{value}</span>
        </div>
    );

    return (
        <div className="animate-fade-in pb-12">
            <header className="mb-8 text-center">
                <h2 className="text-2xl mb-2">03. Confirm</h2>
                <p className="text-sub">注文内容をご確認ください</p>
            </header>

            <div className="grid gap-6">
                <div className="thread-card">
                    <h3 className="text-[9px] font-black tracking-widest text-accent-gold mb-3 border-b border-border/50 pb-2 uppercase">Order Summary</h3>
                    <SummaryItem label="ID" value={order.selectedId} />
                    <SummaryItem label="Plan" value={order.plan || "-"} />
                    <SummaryItem label="Item" value={order.item || "-"} />
                    <SummaryItem label="Details" value={`${order.itemColor} / ${order.itemSize}`} />
                </div>

                <div className="thread-card">
                    <h3 className="text-[9px] font-black tracking-widest text-accent-gold mb-4 border-b border-border/50 pb-2 uppercase">Thread Selection</h3>
                    <div className="flex justify-center gap-4">
                        {order.threads.map((tid, i) => {
                            const color = getThreadColor(tid);
                            return (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div
                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: color?.hex }}
                                    />
                                    <span className="text-[10px] font-bold text-text-main">{tid}</span>
                                </div>
                            );
                        })}
                        {order.threads.length === 0 && <span className="text-xs text-sub italic">None selected</span>}
                    </div>
                </div>

                {order.notes && (
                    <div className="thread-card">
                        <h3 className="text-[9px] font-black tracking-widest text-accent-gold mb-2 border-b border-border/50 pb-2 uppercase">Remarks</h3>
                        <p className="text-xs leading-relaxed line-clamp-3">{order.notes}</p>
                    </div>
                )}

                <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-[9px] font-black tracking-widest text-sub uppercase">Total Amount</span>
                    <span className="text-3xl font-black font-title">¥{order.totalPrice.toLocaleString()}</span>
                </div>
            </div>

            <div className="mt-8">
                <button
                    className="submit-btn"
                    disabled={isSubmitting}
                    onClick={onSubmit}
                >
                    {isSubmitting ? "PROCESSING..." : "ORDER FINALIZE"}
                </button>
            </div>
        </div>
    );
}
