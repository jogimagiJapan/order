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
        <div className="flex justify-between items-baseline py-2.5 border-b border-border last:border-0 hover:bg-base-bg/30 transition-colors px-1">
            <span className="text-[10px] font-black tracking-widest text-sub uppercase">{label}</span>
            <span className="text-sm font-bold text-right">{value}</span>
        </div>
    );

    return (
        <div className="animate-fade-in pb-20">
            <header className="mb-8 text-center">
                <h2 className="text-2xl mb-1 mt-4">03. Review</h2>
                <p className="text-sub">最終確認をお願いします</p>
            </header>

            <div className="grid gap-6">
                {/* Visual Thread Selection Header */}
                <div className="thread-card bg-white border-2 border-accent-gold/20">
                    <h3 className="text-[10px] font-black tracking-widest text-accent-gold mb-6 border-b border-border pb-3 uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-gold"></span>
                        Design Selection
                    </h3>
                    <div className="flex justify-center gap-6 mb-4">
                        {order.threads.map((tid, i) => {
                            const color = getThreadColor(tid);
                            return (
                                <div key={i} className="flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div
                                        className="w-14 h-14 rounded-full border-4 border-white shadow-md ring-1 ring-border"
                                        style={{ backgroundColor: color?.hex }}
                                    />
                                    <span className="text-xs font-black text-text-main">{tid}</span>
                                </div>
                            );
                        })}
                        {order.threads.length === 0 && <span className="text-xs text-sub italic">None selected</span>}
                    </div>
                </div>

                <div className="thread-card shadow-lg">
                    <h3 className="text-[10px] font-black tracking-widest text-accent-gold mb-2 border-b border-border pb-2 uppercase">Order Details</h3>
                    <div className="grid gap-1">
                        <SummaryItem label="ID" value={order.selectedId} />
                        <SummaryItem label="Plan" value={order.plan || "-"} />
                        <SummaryItem label="Item" value={order.item || "-"} />
                        <SummaryItem label="Color" value={order.itemColor || "-"} />
                        <SummaryItem label="Size" value={order.itemSize || "-"} />
                    </div>
                </div>

                {order.notes && (
                    <div className="thread-card opacity-80 scale-95 origin-top">
                        <h3 className="text-[9px] font-black tracking-widest text-accent-gold mb-2 border-b border-border pb-2 uppercase">Remarks</h3>
                        <p className="text-xs leading-relaxed italic line-clamp-2">"{order.notes}"</p>
                    </div>
                )}

                <div className="flex justify-between items-end px-4 py-4 mb-4 border-t-2 border-dashed border-border mt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-widest text-sub uppercase mb-1">Total Amount</span>
                        <span className="text-[9px] text-accent-rose font-bold">Tax Included</span>
                    </div>
                    <span className="text-4xl font-black font-title tracking-tighter">¥{order.totalPrice.toLocaleString()}</span>
                </div>
            </div>

            <button
                className="submit-btn active:scale-95 transition-transform"
                disabled={isSubmitting}
                onClick={onSubmit}
            >
                {isSubmitting ? "PROCESSING..." : "ORDER FINALIZE"}
            </button>
        </div>
    );
}
