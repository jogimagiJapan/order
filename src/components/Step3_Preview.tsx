"use client";

import { OrderState } from "@/hooks/useOrderForm";
import { THREAD_COLORS } from "@/constants/colors";

export default function Step3_Preview({
    order
}: {
    order: OrderState;
}) {
    const getThreadColor = (id: string) => THREAD_COLORS.find(c => c.id === id);

    const SummaryRow = ({ label, value }: { label: string; value: string }) => (
        <div className="summary-row">
            <span className="summary-label">{label}</span>
            <span className="summary-value">{value}</span>
        </div>
    );

    return (
        <div className="animate-fade-in pb-10">
            <header className="mb-10 text-center">
                <h2 className="text-2xl mb-1 mt-6">03. Review</h2>
                <p className="text-sub">ご注文内容の最終確認</p>
            </header>

            <div className="grid gap-8">
                {/* Order Details List */}
                <div className="thread-card shadow-sm">
                    <h3 className="text-[10px] font-black tracking-widest text-accent-gold mb-4 border-b border-border pb-3 uppercase">
                        Order Details
                    </h3>
                    <div className="summary-list">
                        <SummaryRow label="order id" value={order.selectedId} />
                        <SummaryRow label="selected plan" value={order.plan || "-"} />
                        <SummaryRow label="target item" value={order.item || "-"} />
                        <SummaryRow label="item color" value={order.itemColor || "-"} />
                        <SummaryRow label="item size" value={order.itemSize || "-"} />
                    </div>
                </div>

                {/* Thread Selection with Chips */}
                <div className="thread-card shadow-sm">
                    <h3 className="text-[10px] font-black tracking-widest text-accent-gold mb-6 border-b border-border pb-3 uppercase">
                        Thread Selection
                    </h3>
                    <div className="thread-preview-grid">
                        {order.threads.map((tid, i) => {
                            const color = getThreadColor(tid);
                            return (
                                <div key={i} className="thread-preview-item animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div
                                        className="color-dot-large"
                                        style={{ backgroundColor: color?.hex }}
                                    />
                                    <div className="flex flex-col items-center mt-1">
                                        <span className="text-[10px] font-black leading-none">{tid}</span>
                                        <span className="text-[8px] text-sub font-bold uppercase mt-1">{color?.name}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Remarks and Total Section */}
                <div className="thread-card shadow-sm">
                    {order.notes && (
                        <div className="mb-6 px-1">
                            <h3 className="text-[9px] font-black tracking-widest text-accent-gold mb-2 uppercase">Remarks</h3>
                            <p className="text-xs text-text-main/80 italic leading-relaxed border-l-2 border-border pl-3">
                                {order.notes}
                            </p>
                        </div>
                    )}

                    <div className="total-section">
                        <div className="flex flex-col">
                            <span className="total-label">Subtotal</span>
                            <span className="text-[10px] text-accent-rose font-bold mt-0.5">Tax Included</span>
                        </div>
                        <span className="total-amount">¥{order.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
