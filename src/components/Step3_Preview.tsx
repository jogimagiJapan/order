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

    return (
        <div className="animate-fade-in">
            <h2 className="mb-4 text-center">Step 03: Confirm</h2>

            <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
                <div className="grid gap-4 text-sm">
                    <div className="flex justify-between border-bottom pb-2">
                        <span className="text-sub">Selected ID</span>
                        <span className="font-bold">{order.selectedId}</span>
                    </div>
                    <div className="flex justify-between border-bottom pb-2">
                        <span className="text-sub">Plan</span>
                        <span className="font-bold">{order.plan}</span>
                    </div>
                    <div className="flex justify-between border-bottom pb-2">
                        <span className="text-sub">Item</span>
                        <span className="font-bold">{order.item} / {order.itemColor} / {order.itemSize}</span>
                    </div>
                    <div>
                        <span className="text-sub block mb-2">Thread Colors</span>
                        <div className="flex gap-4">
                            {[order.thread1, order.thread2, order.thread3].map((tid, i) => {
                                const color = getThreadColor(tid);
                                if (!tid || (order.plan === 'Lite' && i > 0)) return null;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: color?.hex }} />
                                        <span className="text-[10px] font-bold">{tid}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {order.notes && (
                        <div>
                            <span className="text-sub block mb-1">Remarks</span>
                            <p className="bg-base-bg p-3 rounded-lg text-xs">{order.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-primary text-white p-6 rounded-2xl flex justify-between items-center mb-8">
                <span className="font-title uppercase tracking-widest text-sm">Total Amount</span>
                <span className="font-title text-2xl font-bold">¥{order.totalPrice.toLocaleString()}</span>
            </div>

            <button
                className="submit-btn"
                disabled={isSubmitting}
                onClick={onSubmit}
                style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontWeight: 'bold',
                    opacity: isSubmitting ? 0.5 : 1
                }}
            >
                {isSubmitting ? "SENDING..." : "ORDER FINALIZE"}
            </button>
        </div>
    );
}
