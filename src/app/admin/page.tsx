"use client";

import { useState, useEffect, useMemo } from "react";
import { resolveThreadColor } from "@/constants/colors";
import { ACTIVE_GAS_URL } from "@/constants/gas";
import { parseDisplayId } from "@/utils/id";

interface DeliveryInfo {
    zip: string;
    address: string;
    building: string;
    name: string;
    phone: string;
    email: string;
    shippingFee: number;
    progress: string;
    trackingNumber: string;
}

interface Submission {
    timestamp: string;
    selectedId: string;
    plan: string;
    option: string;
    item: string;
    itemColor: string;
    itemSize: string;
    thread1: string;
    thread2: string;
    thread3: string;
    notes: string;
    totalPrice: number;
    status: string;
    deliveryMethod: string;
    shippingFee: number;
    soundCardQty: number;
    gpsDatetime: string;
    gpsLocation: string;
    delivery?: DeliveryInfo | null;
}

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
    const [idQuery, setIdQuery] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("sts_completed_orders");
        if (saved) {
            try {
                setCompletedIds(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse completed orders", e);
            }
        }
        fetchData();
    }, []);

    async function fetchData() {
        setRefreshing(true);
        try {
            const res = await fetch(ACTIVE_GAS_URL);
            const data = await res.json();
            setSubmissions(data.submissions || []);
            setSelectedIndex(0);
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const toggleCompleted = (id: string) => {
        setCompletedIds(prev => {
            const next = { ...prev, [id]: !prev[id] };
            localStorage.setItem("sts_completed_orders", JSON.stringify(next));
            return next;
        });
    };

    const filteredSubmissions = useMemo(() => {
        const q = idQuery.trim().toLowerCase();
        if (!q) return submissions;
        return submissions.filter(sub =>
            String(sub.selectedId || "").toLowerCase().includes(q)
        );
    }, [submissions, idQuery]);

    useEffect(() => {
        if (selectedIndex >= filteredSubmissions.length) {
            setSelectedIndex(0);
        }
    }, [filteredSubmissions.length, selectedIndex]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center font-bold text-slate-400 gap-4">
            <div className="spinner" style={{ width: 24, height: 24 }}></div>
            LOADING DASHBOARD...
        </div>
    );

    const current = filteredSubmissions[selectedIndex];

    if (!submissions.length) {
        return (
            <div className="container py-20 text-center">
                <h1 className="admin-dashboard-title mb-4">DASHBOARD</h1>
                <p className="text-sub">No submissions found.</p>
            </div>
        );
    }

    const getThreadColor = (id: string) => resolveThreadColor(id);

    return (
        <div className="bg-slate-50 min-h-screen pb-32">
            <div className="container py-6">
                <header className="mb-4 px-2">
                    <h1 className="admin-dashboard-title mb-4">DASHBOARD</h1>
                    <div className="admin-search">
                        <input
                            className="admin-search-input"
                            type="search"
                            placeholder="ID検索（例: 005608 / username）"
                            value={idQuery}
                            onChange={(e) => {
                                setIdQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                        />
                        {idQuery.trim() && (
                            <button
                                type="button"
                                className="admin-search-clear"
                                onClick={() => {
                                    setIdQuery("");
                                    setSelectedIndex(0);
                                }}
                            >
                                クリア
                            </button>
                        )}
                    </div>
                </header>

                <main>
                    {!current ? (
                        <section className="instruction-sheet mb-8 text-center py-12">
                            <p className="text-sub font-bold">「{idQuery}」に一致する注文はありません</p>
                        </section>
                    ) : (
                        <OrderDetail
                            current={current}
                            isCompleted={!!completedIds[current.selectedId]}
                            onToggleCompleted={() => toggleCompleted(current.selectedId)}
                            getThreadColor={getThreadColor}
                        />
                    )}

                    <section>
                        <h3 className="admin-label mb-4 ml-2">
                            History{idQuery.trim() ? `（${filteredSubmissions.length}件）` : ""}
                        </h3>
                        <div className="history-list space-y-2">
                            {filteredSubmissions.map((sub, idx) => {
                                const subCompleted = completedIds[sub.selectedId] || false;
                                const subDisplayId = parseDisplayId(sub.selectedId);
                                return (
                                    <div
                                        key={`${sub.selectedId}-${idx}`}
                                        className={`history-item transition-all ${selectedIndex === idx ? "border-slate-900 ring-2 ring-slate-900/5 bg-slate-50" : "hover:bg-slate-50/50"} ${subCompleted ? "opacity-40 grayscale" : ""}`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <div className="history-display-id">
                                                <span className="id-time">
                                                    {subDisplayId.time}
                                                    {sub.deliveryMethod === "配送" && (
                                                        <span className="history-ship-mark">配送</span>
                                                    )}
                                                </span>
                                                {subDisplayId.username && (
                                                    <span className="id-user">{subDisplayId.username}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-900 uppercase">{sub.plan}</p>
                                            <p className="text-xs font-bold text-slate-400">¥{Number(sub.totalPrice || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </main>
            </div>

            <button
                className="admin-fab"
                onClick={fetchData}
                disabled={refreshing}
                title="Refresh Data"
            >
                {refreshing ? (
                    <div className="spinner" style={{ width: 24, height: 24, borderColor: "rgba(255,255,255,0.2)", borderTopColor: "white" }}></div>
                ) : (
                    <span className="text-2xl font-black">↺</span>
                )}
            </button>
        </div>
    );
}

function OrderDetail({
    current,
    isCompleted,
    onToggleCompleted,
    getThreadColor,
}: {
    current: Submission;
    isCompleted: boolean;
    onToggleCompleted: () => void;
    getThreadColor: (id: string) => { id: string; hex: string; name: string } | undefined;
}) {
    const formattedTimestamp = new Date(current.timestamp).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
    const displayId = parseDisplayId(current.selectedId);
    const isShippingOrder = current.deliveryMethod === "配送";
    const delivery = current.delivery;
    const showGps = current.option === "GPS日時" || !!current.gpsDatetime || !!current.gpsLocation;

    return (
        <section className={`instruction-sheet mb-8 animate-fade-in ${isCompleted ? "is-completed" : ""}`}>
            <div className="admin-card-header mb-8">
                <div className="admin-header-row">
                    <div className="admin-badge-group">
                        <span className={`admin-badge ${isCompleted ? "is-done" : ""}`}>
                            {isCompleted ? "COMPLETED" : "NEW ORDER"}
                        </span>
                        {isShippingOrder && <span className="admin-badge is-shipping">配送</span>}
                    </div>
                    <p className="admin-timestamp">{formattedTimestamp}</p>
                </div>

                <div className="admin-display-id">
                    <span className="id-time">{displayId.time}</span>
                    {displayId.username && <span className="id-user">{displayId.username}</span>}
                </div>

                <div className="admin-header-row admin-header-row-end">
                    <button
                        type="button"
                        className={`admin-complete-btn ${isCompleted ? "is-done" : ""}`}
                        onClick={onToggleCompleted}
                    >
                        {isCompleted ? "作業完了" : "作業中"}
                    </button>
                    <p className="admin-price">
                        ¥{Number(current.totalPrice || 0).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid gap-3 mb-8">
                <div className="admin-grid-2">
                    <div className="admin-grid-val">
                        <p className="value">{current.plan}</p>
                        <p className="label-small">Plan</p>
                    </div>
                    <div className="admin-grid-val">
                        <p className="value">{current.option || "なし"}</p>
                        <p className="label-small">Option</p>
                    </div>
                </div>

                {showGps && (
                    <>
                        <div className="admin-grid-val admin-grid-full">
                            <p className="value value-wrap">{current.gpsDatetime || "-"}</p>
                            <p className="label-small">GPS Time</p>
                        </div>
                        <div className="admin-grid-val admin-grid-full">
                            <p className="value value-wrap">{current.gpsLocation || "-"}</p>
                            <p className="label-small">GPS Location</p>
                        </div>
                    </>
                )}

                <div className="admin-grid-2">
                    <div className="admin-grid-val">
                        <p className="value">{current.item}</p>
                        <p className="label-small">Item</p>
                    </div>
                    <div className="admin-grid-val">
                        <p className="value">{current.itemColor || "-"}</p>
                        <p className="label-small">Color</p>
                    </div>
                </div>
                <div className="admin-grid-2">
                    <div className="admin-grid-val">
                        <p className="value">{current.itemSize || "-"}</p>
                        <p className="label-small">Size</p>
                    </div>
                    <div className="admin-grid-val">
                        <p className="value">
                            {(current.soundCardQty || 0) > 0 ? `${current.soundCardQty}枚` : "なし"}
                        </p>
                        <p className="label-small">Sound Card</p>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <div className="thread-preview-grid">
                    {[current.thread1, current.thread2, current.thread3].map((tid, i) => {
                        const color = getThreadColor(tid);
                        if (!tid || (current.plan === "Lite" && i > 0)) return null;
                        return (
                            <div key={i} className="thread-preview-item">
                                <div
                                    className="color-dot-large"
                                    style={{ backgroundColor: color?.hex, width: 60, height: 60 }}
                                />
                                <span className="thread-id-name">
                                    {tid}:{color?.name || "—"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {current.notes && (
                <div className="admin-remarks mb-8">
                    <h3 className="admin-label mb-2">Remarks</h3>
                    <p className="admin-remarks-text">{current.notes}</p>
                </div>
            )}

            {isShippingOrder && (
                <div className="admin-delivery">
                    <div className="admin-delivery-head">
                        <h3 className="admin-label">Shipping To</h3>
                        {delivery?.progress && (
                            <span className="admin-delivery-progress">{delivery.progress}</span>
                        )}
                    </div>
                    {delivery ? (
                        <div className="admin-delivery-body">
                            <p className="admin-delivery-name">{delivery.name} 様</p>
                            <p>〒{delivery.zip}</p>
                            <p>{delivery.address}</p>
                            {delivery.building && <p>{delivery.building}</p>}
                            <p>{delivery.phone}</p>
                            <p>{delivery.email}</p>
                            <div className="admin-delivery-meta">
                                <span>送料 ¥{(delivery.shippingFee || 0).toLocaleString()}</span>
                                <span>送り状 {delivery.trackingNumber || "未発行"}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="admin-delivery-empty">
                            配送先データが見つかりません（配送情報シートをご確認ください）
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}
