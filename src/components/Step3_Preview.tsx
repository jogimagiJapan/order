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
    const getThreadName = (id: string) => THREAD_COLORS.find(c => c.id === id)?.name || "Not Selected";
    const getThreadHex = (id: string) => THREAD_COLORS.find(c => c.id === id)?.hex || "transparent";

    const SummaryItem = ({ label, value, color }: { label: string; value: string; color?: string }) => (
        <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
            <span className="text-[10px] font-black tracking-widest text-sub uppercase">{label}</span>
            <div className="flex items-center gap-2">
                {color && (
                    <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: color }} />
                )}
                <span className="text-sm font-bold">{value}</span>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in pb-10">
            <header className="mb-10 text-center">
                <h2 className="text-2xl mb-2">03. Confirm</h2>
                <p className="text-sub">注文内容をご確認ください</p>
            </header>

            <div className="thread-card mb-8">
                <h3 className="text-xs font-black tracking-widest text-accent-gold mb-4 border-b border-border pb-2 uppercase">Order Summary</h3>
                <SummaryItem label="ID" value={order.selectedId} />
                <SummaryItem label="Plan" value={order.plan || "-"} />
                <SummaryItem label="Item" value={order.item || "-"} />
                <SummaryItem label="Color" value={order.itemColor || "-"} />
                <SummaryItem label="Size" value={order.itemSize || "-"} />
            </div>

            <div className="thread-card mb-8">
                <h3 className="text-xs font-black tracking-widest text-accent-gold mb-4 border-b border-border pb-2 uppercase">Thread Selection</h3>
                <SummaryItem label="Thread 1" value={getThreadName(order.thread1)} color={getThreadHex(order.thread1)} />
                {order.plan !== "Lite" && (
                    <>
                        <SummaryItem label="Thread 2" value={getThreadName(order.thread2)} color={getThreadHex(order.thread2)} />
                        <SummaryItem label="Thread 3" value={getThreadName(order.thread3)} color={getThreadHex(order.thread3)} />
                    </>
                )}
            </div>

            {order.notes && (
                <div className="thread-card mb-8">
                    <h3 className="text-xs font-black tracking-widest text-accent-gold mb-4 border-b border-border pb-2 uppercase">Remarks</h3>
                    <p className="text-sm leading-relaxed">{order.notes}</p>
                </div>
            )}

            <div className="thread-card mb-10 bg-[#f8f9fa] border-none">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black tracking-widest text-sub uppercase mb-1">Total Amount</span>
                    <span className="text-3xl font-black font-title">¥{order.totalPrice.toLocaleString()}</span>
                </div>
            </div>

            <button
                className="submit-btn"
                disabled={isSubmitting}
                onClick={onSubmit}
            >
                {isSubmitting ? "SENDING..." : "ORDER FINALIZE"}
            </button>
        </div>
    );
}
