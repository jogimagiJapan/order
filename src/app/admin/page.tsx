"use client";

import { useState, useEffect, useRef } from "react";
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
    ticketNumber?: number | string;
    delivery?: DeliveryInfo | null;
}

interface MasterItem {
    name: string;
    note: string;
}

interface ReviewImageResult {
    found: boolean;
    reason?: string;
    name?: string;
    mimeType?: string;
    imageBase64?: string;
}

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_LIMIT = 30;

/** GAS 未反映時でも Admin で同じ対応表を使う（マスタがあれば上書き） */
const DEFAULT_PLAN_REVIEW: Record<string, string> = {
    Lite: "wave1",
    Limited: "",
    "Std Wave": "review1",
    "Std Circle": "review2",
};

const reviewImageCache = new Map<string, ReviewImageResult>();

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [idQuery, setIdQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Submission[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [planReview, setPlanReview] = useState<Record<string, string>>({});
    const searchSeq = useRef(0);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setRefreshing(true);
        try {
            const res = await fetch(ACTIVE_GAS_URL);
            const data = await res.json();
            setSubmissions(data.submissions || []);
            const reviewMap: Record<string, string> = { ...DEFAULT_PLAN_REVIEW };
            (data.masterData?.planReview || []).forEach((row: MasterItem) => {
                reviewMap[String(row.name).trim()] = String(row.note || "").trim();
            });
            setPlanReview(reviewMap);
            setSelectedIndex(0);
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        const q = idQuery.trim();
        if (!q) return;
        const seq = ++searchSeq.current;
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ action: "searchOrders", q });
                const res = await fetch(`${ACTIVE_GAS_URL}?${params}`);
                const data = await res.json();
                if (seq !== searchSeq.current) return;
                setSearchResults(data.results || []);
                setSearchError(data.error ? "検索に失敗しました" : "");
            } catch (err) {
                console.error("Failed to search orders", err);
                if (seq === searchSeq.current) setSearchError("検索に失敗しました");
            } finally {
                if (seq === searchSeq.current) setSearching(false);
            }
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [idQuery]);

    const updateQuery = (value: string) => {
        setIdQuery(value);
        setSelectedIndex(0);
        if (value.trim()) {
            setSearching(true);
        } else {
            searchSeq.current++;
            setSearchResults(null);
            setSearching(false);
            setSearchError("");
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center font-bold text-slate-400 gap-4">
            <div className="spinner" style={{ width: 24, height: 24 }}></div>
            LOADING DASHBOARD...
        </div>
    );

    const isSearchMode = idQuery.trim() !== "";
    const list = isSearchMode ? (searchResults ?? []) : submissions;
    const current = list[selectedIndex] ?? list[0];
    const currentIndex = current ? list.indexOf(current) : -1;

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
        <div className="bg-slate-50 min-h-screen pb-24 admin-compact">
            <div className="container py-3">
                <header className="mb-3 px-2">
                    <h1 className="admin-dashboard-title">DASHBOARD</h1>
                </header>

                <main>
                    {!current ? (
                        <section className="instruction-sheet mb-4 text-center py-8">
                            <p className="text-sub font-bold">
                                {searching
                                    ? "検索中…"
                                    : searchError || `「${idQuery.trim()}」に一致する注文はありません`}
                            </p>
                        </section>
                    ) : (
                        <OrderDetail
                            current={current}
                            getThreadColor={getThreadColor}
                            reviewType={planReview[String(current.plan).trim()] || ""}
                        />
                    )}

                    <section>
                        <h3 className="admin-label mb-2 ml-2">
                            {isSearchMode
                                ? `Search（${searching ? "検索中…" : `${list.length}件${list.length >= SEARCH_LIMIT ? "・新しい順に上限" : ""}`}）`
                                : "History"}
                        </h3>
                        <div className="admin-search mb-2">
                            <input
                                className="admin-search-input"
                                type="search"
                                placeholder="ID検索（例: 20261113 / 005608 / username）"
                                value={idQuery}
                                onChange={(e) => updateQuery(e.target.value)}
                            />
                            {isSearchMode && (
                                <button
                                    type="button"
                                    className="admin-search-clear"
                                    onClick={() => updateQuery("")}
                                >
                                    クリア
                                </button>
                            )}
                        </div>
                        {isSearchMode && searchError && current && (
                            <p className="admin-search-error mb-2">{searchError}</p>
                        )}
                        <div className="history-list">
                            {list.map((sub, idx) => {
                                const subDisplayId = parseDisplayId(sub.selectedId);
                                const ticket = Number(sub.ticketNumber);
                                return (
                                    <div
                                        key={`${sub.selectedId}-${idx}`}
                                        className={`history-item transition-all ${currentIndex === idx ? "border-slate-900 ring-2 ring-slate-900/5 bg-slate-50" : "hover:bg-slate-50/50"}`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`history-ticket ${ticket >= 1 && ticket <= 6 ? "" : "is-empty"}`}>
                                                {ticket >= 1 && ticket <= 6 ? ticket : "–"}
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
    getThreadColor,
    reviewType,
}: {
    current: Submission;
    getThreadColor: (id: string) => { id: string; hex: string; name: string } | undefined;
    reviewType: string;
}) {
    const [shippingOpen, setShippingOpen] = useState(false);

    useEffect(() => {
        setShippingOpen(false);
    }, [current.selectedId]);

    const formattedTimestamp = new Date(current.timestamp).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
    const displayId = parseDisplayId(current.selectedId);
    const idLine = displayId.username
        ? `${displayId.time}_${displayId.username}`
        : displayId.time;
    const isShippingOrder = current.deliveryMethod === "配送";
    const delivery = current.delivery;
    const hasGps = current.option === "GPS日時" || !!current.gpsDatetime || !!current.gpsLocation;
    const hasSoundCard = (current.soundCardQty || 0) > 0;
    const ticket = Number(current.ticketNumber);
    const hasTicket = ticket >= 1 && ticket <= 6;

    return (
        <section className="instruction-sheet mb-4 animate-fade-in">
            <div className="admin-card-header mb-4">
                <div className="admin-header-row">
                    {isShippingOrder ? (
                        <span className="admin-badge is-shipping">配送</span>
                    ) : (
                        <span />
                    )}
                    <p className="admin-timestamp">{formattedTimestamp}</p>
                </div>

                <div className="admin-ticket-row">
                    <div className={`admin-ticket-number ${hasTicket ? "" : "is-empty"}`}>
                        {hasTicket ? ticket : "–"}
                    </div>
                    <p className="admin-price">
                        ¥{Number(current.totalPrice || 0).toLocaleString()}
                    </p>
                </div>

                <div className="admin-display-id">
                    <span className="id-line">{idLine}</span>
                </div>
            </div>

            <div className="admin-info-grid mb-4">
                <div className="admin-grid-2">
                    <div className="admin-grid-val">
                        <p className="value">{current.plan}</p>
                        <p className="label-small">Plan</p>
                    </div>
                    <div className={`admin-grid-val ${hasGps ? "is-emphasis" : "is-muted"}`}>
                        <p className="value">{hasGps ? (current.option || "GPS日時") : "なし"}</p>
                        <p className="label-small">GPS</p>
                    </div>
                </div>

                {hasGps ? (
                    <>
                        <div className="admin-gps-box is-emphasis">
                            <span className="admin-gps-index" aria-hidden>1</span>
                            <p className="admin-gps-text">{current.gpsDatetime || "-"}</p>
                        </div>
                        <div className="admin-gps-box is-emphasis">
                            <span className="admin-gps-index" aria-hidden>2</span>
                            <p className="admin-gps-text">{current.gpsLocation || "-"}</p>
                        </div>
                    </>
                ) : (
                    <div className="admin-gps-box is-muted">
                        <p className="admin-gps-text">なし</p>
                    </div>
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
                    <div className={`admin-grid-val ${hasSoundCard ? "is-emphasis" : "is-muted"}`}>
                        <p className="value">
                            {hasSoundCard ? `${current.soundCardQty}枚` : "なし"}
                        </p>
                        <p className="label-small">Sound Card</p>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="thread-preview-grid">
                    {[current.thread1, current.thread2, current.thread3].map((tid, i) => {
                        const color = getThreadColor(tid);
                        if (!tid || (current.plan === "Lite" && i > 0)) return null;
                        return (
                            <div key={i} className="thread-preview-item">
                                <div
                                    className="color-swatch"
                                    style={{ backgroundColor: color?.hex }}
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
                <div className="admin-remarks mb-3">
                    <h3 className="admin-label mb-1">Remarks</h3>
                    <p className="admin-remarks-text">{current.notes}</p>
                </div>
            )}

            {reviewType && current.selectedId && (
                <ReviewImage
                    key={`${current.selectedId}|${current.plan}`}
                    id={current.selectedId}
                    plan={String(current.plan).trim()}
                />
            )}

            {isShippingOrder && (
                <div className={`admin-delivery ${shippingOpen ? "is-open" : ""}`}>
                    <button
                        type="button"
                        className="admin-delivery-toggle"
                        onClick={() => setShippingOpen(open => !open)}
                        aria-expanded={shippingOpen}
                    >
                        <span className="admin-label">Shipping To</span>
                        <span className="admin-delivery-toggle-meta">
                            {delivery?.progress && (
                                <span className="admin-delivery-progress">{delivery.progress}</span>
                            )}
                            <span className="admin-delivery-chevron">{shippingOpen ? "▲" : "▼"}</span>
                        </span>
                    </button>
                    {shippingOpen && (
                        delivery ? (
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
                        )
                    )}
                </div>
            )}
        </section>
    );
}

function ReviewImage({ id, plan }: { id: string; plan: string }) {
    const cacheKey = `${id}|${plan}`;
    const [result, setResult] = useState<ReviewImageResult | null>(
        () => reviewImageCache.get(cacheKey) ?? null
    );

    useEffect(() => {
        if (reviewImageCache.has(cacheKey)) return;
        let cancelled = false;
        const params = new URLSearchParams({ action: "reviewImage", id, plan });
        fetch(`${ACTIVE_GAS_URL}?${params}`)
            .then(res => res.json())
            .then((data: ReviewImageResult) => {
                // 見つからない結果はキャッシュしない（後から PNG が保存されることがある）
                if (data.found) reviewImageCache.set(cacheKey, data);
                if (!cancelled) setResult(data);
            })
            .catch(err => {
                console.error("Failed to load review image", err);
                if (!cancelled) setResult({ found: false, reason: "error" });
            });
        return () => {
            cancelled = true;
        };
    }, [cacheKey, id, plan]);

    if (result?.reason === "noPlanImage") return null;

    let message = "";
    if (!result) {
        message = "レビュー画像を読み込み中…";
    } else if (!result.found) {
        if (result.reason === "noFolder") {
            message = "マスタデータの Config / PNGフォルダ が未設定です";
        } else if (result.reason === "notFound") {
            message = `レビュー画像が見つかりません（${result.name}）`;
        } else {
            message = "レビュー画像の取得に失敗しました";
        }
    }

    return (
        <div className="admin-review mb-3">
            <h3 className="admin-label mb-1">Review</h3>
            {result?.found && result.imageBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    className="admin-review-img"
                    src={`data:${result.mimeType || "image/png"};base64,${result.imageBase64}`}
                    alt={result.name || "レビュー画像"}
                />
            ) : (
                <p className="admin-review-empty">{message}</p>
            )}
        </div>
    );
}
