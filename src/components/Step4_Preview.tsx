"use client";

import { OrderState } from "@/hooks/useOrderForm";
import { THREAD_COLORS } from "@/constants/colors";
import { normalizeZip } from "@/utils/shipping";

export default function Step4_Preview({
    order
}: {
    order: OrderState;
}) {
    const getThreadColor = (id: string) => THREAD_COLORS.find(c => c.id === id);
    const isShipping = order.deliveryMethod === "shipping";
    const itemsSubtotal = order.totalPrice - order.shippingFee;

    const formatZip = (zip: string) => {
        const digits = normalizeZip(zip);
        return digits.length === 7 ? `〒${digits.slice(0, 3)}-${digits.slice(3)}` : zip;
    };

    const SummaryRow = ({ label, value }: { label: string; value: string }) => (
        <div className="summary-row">
            <span className="summary-label">{label}</span>
            <span className="summary-value">{value}</span>
        </div>
    );

    return (
        <div className="animate-fade-in pb-10">
            <header className="mb-10 text-center">
                <h2 className="mb-1">04. Review</h2>
                <p className="text-sub">ご注文内容の最終確認</p>
            </header>

            <div className="grid gap-8 preview-grid-pc">
                {/* Order Details List */}
                <div className="thread-card shadow-sm review-left">
                    <h3 className="text-[10px] font-black tracking-widest text-accent-gold mb-4 border-b border-border pb-3 uppercase">
                        Order Details
                    </h3>
                    <div className="summary-list">
                        <SummaryRow label="ID" value={order.selectedId} />
                        <SummaryRow label="PLAN" value={order.plan || "-"} />
                        <SummaryRow label="OPTION" value={order.option || "-"} />
                        <SummaryRow label="ITEM" value={order.item || "-"} />
                        <SummaryRow label="COLOR" value={order.itemColor || "-"} />
                        <SummaryRow label="SIZE" value={order.itemSize || "-"} />
                        <SummaryRow label="RECEIVE" value={isShipping ? "後日配送" : "本日お渡し"} />
                    </div>

                    {isShipping && (
                        <div className="review-shipping">
                            <h4 className="review-shipping-title">Shipping To</h4>
                            <p className="review-shipping-line">{formatZip(order.shipping.zip)}</p>
                            <p className="review-shipping-line">{order.shipping.address}</p>
                            {order.shipping.building && (
                                <p className="review-shipping-line">{order.shipping.building}</p>
                            )}
                            <p className="review-shipping-line is-name">{order.shipping.name} 様</p>
                            <p className="review-shipping-line">{order.shipping.phone}</p>
                            <p className="review-shipping-line">{order.shipping.email}</p>
                        </div>
                    )}
                </div>

                {/* Thread Selection with Chips */}
                <div className="thread-card shadow-sm review-right-top">
                    <h3 className="text-[10px] font-black tracking-widest text-accent-gold mb-6 border-b border-border pb-3 uppercase">
                        Thread Selection
                    </h3>
                    <div className="thread-preview-grid">
                        {order.threads.map((tid, i) => {
                            const color = getThreadColor(tid);
                            return (
                                <div key={i} className="thread-preview-item animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                    <span className="text-[10px] font-black leading-none mb-2">{tid}</span>
                                    <div
                                        className="color-dot-large"
                                        style={{ backgroundColor: color?.hex }}
                                    />
                                    <span className="text-[8px] text-sub font-bold uppercase mt-2">{color?.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Remarks and Total Section */}
                <div className="thread-card shadow-sm review-right-bottom">
                    {order.notes && (
                        <div className="mb-6 px-1">
                            <h3 className="text-[9px] font-black tracking-widest text-accent-gold mb-2 uppercase">Remarks</h3>
                            <p className="text-xs text-text-main/80 italic leading-relaxed border-l-2 border-border pl-3">
                                {order.notes}
                            </p>
                        </div>
                    )}

                    {isShipping && (
                        <div className="total-breakdown">
                            <div className="breakdown-row">
                                <span>商品小計</span>
                                <span>¥{itemsSubtotal.toLocaleString()}</span>
                            </div>
                            <div className="breakdown-row">
                                <span>送料</span>
                                <span>¥{order.shippingFee.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="total-section">
                        <div className="total-label-block">
                            <span className="total-label">Total</span>
                            <span className="total-tax">税込</span>
                        </div>
                        <span className="total-amount">¥{order.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
