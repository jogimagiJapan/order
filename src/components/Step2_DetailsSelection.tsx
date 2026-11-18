"use client";

import {
    Plan,
    PlanOption,
    MasterData,
    OrderState,
    isBringInItem,
    OTHER_OPTION,
    SOUND_CARD_UNIT_PRICE,
    SOUND_CARD_MAX_QTY,
} from "@/hooks/useOrderForm";
import ThreadSelector from "./ThreadSelector";
import { getVisibleThreadColors } from "@/constants/colors";
import {
    GPS_OPTION_PRICE,
    GPS_TEXT_MAX,
    formatGpsDatetimeFromId,
    sanitizeGpsText,
} from "@/utils/gps";
import { PLANS, threadLimitFor } from "@/utils/plan";
import { SectionTitle, StepHeader } from "./FormHeadings";
import { useEffect, useRef } from "react";

export default function Step2_DetailsSelection({
    order,
    masterData,
    onUpdate
}: {
    order: OrderState;
    masterData: MasterData;
    onUpdate: (updates: Partial<OrderState>) => void;
}) {
    const plansRef = useRef<HTMLElement>(null);
    const optionRef = useRef<HTMLElement>(null);
    const itemsRef = useRef<HTMLElement>(null);
    const colorRef = useRef<HTMLElement>(null);
    const sizeRef = useRef<HTMLElement>(null);
    const threadsRef = useRef<HTMLElement>(null);
    const soundCardRef = useRef<HTMLElement>(null);
    const remarksRef = useRef<HTMLElement>(null);
    const skipThreadScrollRef = useRef(false);

    const bringIn = isBringInItem(order.item);
    const colorReady = bringIn || !!order.itemColor;
    const colorOtherReady = order.itemColor !== OTHER_OPTION || !!order.itemColorOther.trim();
    const sizeOtherReady = order.itemSize !== OTHER_OPTION || !!order.itemSizeOther.trim();
    const visibleThreads = getVisibleThreadColors(masterData.threads);
    const gpsSelected = order.option === "GPS日時";

    const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    };

    useEffect(() => {
        if (order.plan && !order.option) scrollTo(optionRef);
        else if (order.plan && order.option && !order.item) scrollTo(itemsRef);
    }, [order.plan, order.option, order.item]);

    useEffect(() => {
        if (order.item && !bringIn && !order.itemColor) scrollTo(colorRef);
    }, [order.item, bringIn, order.itemColor]);

    useEffect(() => {
        if (order.item && colorReady && colorOtherReady && !order.itemSize) scrollTo(sizeRef);
    }, [order.item, colorReady, colorOtherReady, order.itemSize]);

    useEffect(() => {
        if (colorReady && colorOtherReady && order.itemSize && sizeOtherReady && order.threads.every(t => !t)) {
            scrollTo(threadsRef);
        }
    }, [colorReady, colorOtherReady, order.itemSize, sizeOtherReady, order.threads]);

    const plans: { id: Plan; label: string; price: string }[] = PLANS.map(p => ({
        id: p.id,
        label: p.id,
        price: `¥${p.price.toLocaleString()}`,
    }));

    const options: { id: PlanOption; label: string; price: string }[] = [
        { id: "GPS日時", label: "GPS日時", price: `+¥${GPS_OPTION_PRICE.toLocaleString()}` },
        { id: "なし", label: "なし", price: "+¥0" },
    ];

    const filteredColors = masterData.colors.filter(c =>
        c.associatedItems.length === 0 || (order.item && c.associatedItems.includes(order.item))
    );
    const filteredSizes = masterData.sizes.filter(s =>
        s.associatedItems.length === 0 || (order.item && s.associatedItems.includes(order.item))
    );

    useEffect(() => {
        const updates: Partial<OrderState> = {};
        if (masterData.items.length === 1 && !order.item) {
            updates.item = masterData.items[0].name;
        }

        if (order.item && !isBringInItem(order.item)) {
            const currentItemColors = masterData.colors.filter(c =>
                c.associatedItems.length === 0 || c.associatedItems.includes(order.item)
            );
            if (currentItemColors.length === 1 && !order.itemColor) {
                updates.itemColor = currentItemColors[0].name;
            }
        }

        if (order.item) {
            const currentItemSizes = masterData.sizes.filter(s =>
                s.associatedItems.length === 0 || s.associatedItems.includes(order.item)
            );
            if (currentItemSizes.length === 1 && !order.itemSize) {
                updates.itemSize = currentItemSizes[0].name;
            }
        }

        if (Object.keys(updates).length > 0) {
            onUpdate(updates);
        }
    }, [masterData, order.item, order.itemColor, order.itemSize, onUpdate]);

    const applyGpsOption = (option: PlanOption) => {
        if (option === "GPS日時") {
            onUpdate({
                option,
                gpsDatetime: order.gpsDatetime || formatGpsDatetimeFromId(order.selectedId),
                gpsLocation: order.gpsLocation || masterData.gpsLocationDefault,
            });
            return;
        }
        onUpdate({
            option,
            gpsDatetime: "",
            gpsLocation: "",
        });
    };

    const handleThreadToggle = (id: string, index?: number) => {
        const count = threadLimitFor(order.plan);
        const newThreads = [...order.threads];

        while (newThreads.length < count) newThreads.push("");

        if (index !== undefined && index < count) {
            newThreads[index] = id;
            onUpdate({ threads: newThreads });
        }
    };

    const handleThreadRandomize = () => {
        const pool = visibleThreads.map(c => c.id);
        if (pool.length === 0) return;
        const count = threadLimitFor(order.plan);
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const threads = Array.from({ length: count }, (_, i) =>
            i < shuffled.length ? shuffled[i] : pool[Math.floor(Math.random() * pool.length)]
        );
        skipThreadScrollRef.current = !threadsReady;
        onUpdate({ threads });
    };

    const threadCount = threadLimitFor(order.plan);
    const threadsReady =
        order.threads.length === threadCount && order.threads.every(t => t !== "");

    useEffect(() => {
        if (!threadsReady) return;
        if (skipThreadScrollRef.current) {
            skipThreadScrollRef.current = false;
            return;
        }
        scrollTo(soundCardRef);
    }, [threadsReady]);

    let activeSection = 0;
    if (!order.plan) activeSection = 1;
    else if (!order.option) activeSection = 2;
    else if (!order.item) activeSection = 3;
    else if (!bringIn && (!order.itemColor || !colorOtherReady)) activeSection = 4;
    else if (!order.itemSize || !sizeOtherReady) activeSection = 5;
    else if (!threadsReady) activeSection = 6;
    else activeSection = 7;


    const sectionClass = (n: number) => `form-section ${activeSection === n ? "focused-section" : ""}`;
    let sectionNum = 0;
    const nextNum = () => ++sectionNum;

    return (
        <div className="animate-fade-in">
            <StepHeader index="02" title="Customize" lead="デザインと詳細を選択してください" />

            <section className={sectionClass(1)} ref={plansRef}>
                <SectionTitle num={nextNum()} label="プラン" en="Plan" />
                <div className="grid grid-2">
                    {plans.map((p) => (
                        <div
                            key={p.id}
                            className={`tile ${order.plan === p.id ? "active" : ""}`}
                            onClick={() => {
                                const limit = threadLimitFor(p.id);
                                const newThreads = order.threads.slice(0, limit);
                                while (newThreads.length < limit) newThreads.push("");
                                onUpdate({
                                    plan: p.id,
                                    threads: newThreads,
                                    option: "",
                                    gpsDatetime: "",
                                    gpsLocation: "",
                                });
                            }}
                        >
                            <span className="tile-title tile-plan">{p.label}</span>
                            <span className="tile-price">{p.price}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className={sectionClass(2)} ref={optionRef}>
                <SectionTitle num={nextNum()} label="オプション" en="Option" />
                <div className="grid grid-2">
                    {!order.plan ? (
                        <div className="tile is-disabled">
                            <span className="tile-note">先にプランを選んでください</span>
                        </div>
                    ) : options.map((o) => (
                        <div
                            key={o.id}
                            className={`tile ${order.option === o.id ? "active" : ""}`}
                            onClick={() => applyGpsOption(o.id)}
                        >
                            <span className="tile-title">{o.label}</span>
                            <span className="tile-price">{o.price}</span>
                        </div>
                    ))}
                </div>
                {gpsSelected && (
                    <div className="gps-fields">
                        <label className="gps-field">
                            <span className="gps-field-label">
                                日時
                                <small>最大{GPS_TEXT_MAX}文字</small>
                            </span>
                            <input
                                className="gps-input"
                                type="text"
                                inputMode="text"
                                maxLength={GPS_TEXT_MAX}
                                placeholder="2026.03.19 00:56:08"
                                value={order.gpsDatetime}
                                onChange={(e) => onUpdate({ gpsDatetime: sanitizeGpsText(e.target.value) })}
                            />
                        </label>
                        <label className="gps-field">
                            <span className="gps-field-label">
                                緯度経度
                                <small>最大{GPS_TEXT_MAX}文字</small>
                            </span>
                            <input
                                className="gps-input"
                                type="text"
                                inputMode="text"
                                maxLength={GPS_TEXT_MAX}
                                placeholder="34.814733,135.378753"
                                value={order.gpsLocation}
                                onChange={(e) => onUpdate({ gpsLocation: sanitizeGpsText(e.target.value) })}
                            />
                        </label>
                        <p className="gps-hint">使用可能: 大文字英字 A–Z・数字・. , - _ : /・スペース（小文字は自動で大文字に変換）</p>
                    </div>
                )}
            </section>

            <section className={sectionClass(3)} ref={itemsRef}>
                <SectionTitle num={nextNum()} label="アイテム" en="Item" />
                <div className="grid grid-2">
                    {masterData.items.map((item) => (
                        <div
                            key={item.name}
                            className={`tile ${order.item === item.name ? "active" : ""}`}
                            onClick={() => {
                                onUpdate({
                                    item: item.name,
                                    itemColor: "",
                                    itemColorOther: "",
                                    itemSize: "",
                                    itemSizeOther: "",
                                });
                            }}
                        >
                            <span className="tile-title">{item.name}</span>
                            <span className="tile-price">+¥{item.price.toLocaleString()}</span>
                            {masterData.items.length === 1 && <span className="badge">自動選択</span>}
                        </div>
                    ))}
                </div>
            </section>

            {!bringIn && (
                <section className={sectionClass(4)} ref={colorRef}>
                    <SectionTitle num={nextNum()} label="カラー" en="Color" />
                    <div className="grid grid-2">
                        {!order.item ? (
                            <div className="tile is-disabled">
                                <span className="tile-note">先にアイテムを選んでください</span>
                            </div>
                        ) : filteredColors.length > 0 ? (
                            filteredColors.map((c) => (
                                <div
                                    key={c.name}
                                    className={`tile ${order.itemColor === c.name ? "active" : ""}`}
                                    onClick={() => onUpdate({
                                        itemColor: c.name,
                                        itemColorOther: c.name === OTHER_OPTION ? order.itemColorOther : "",
                                    })}
                                >
                                    <span className="tile-title">{c.name}</span>
                                    {filteredColors.length === 1 && <span className="badge">自動選択</span>}
                                </div>
                            ))
                        ) : (
                            <div className="tile is-disabled">
                                <span className="tile-note">選べるカラーがありません</span>
                            </div>
                        )}
                    </div>
                    {order.itemColor === OTHER_OPTION && (
                        <input
                            className="other-input"
                            type="text"
                            placeholder="カラーを入力してください"
                            value={order.itemColorOther}
                            onChange={(e) => onUpdate({ itemColorOther: e.target.value })}
                        />
                    )}
                </section>
            )}

            <section className={sectionClass(5)} ref={sizeRef}>
                <SectionTitle num={nextNum()} label="サイズ" en="Size" />
                <div className="grid grid-2">
                    {!order.item ? (
                        <div className="tile is-disabled">
                            <span className="tile-note">先にアイテムを選んでください</span>
                        </div>
                    ) : filteredSizes.length > 0 ? (
                        filteredSizes.map((s) => (
                            <div
                                key={s.name}
                                className={`tile ${order.itemSize === s.name ? "active" : ""}`}
                                onClick={() => onUpdate({
                                    itemSize: s.name,
                                    itemSizeOther: s.name === OTHER_OPTION ? order.itemSizeOther : "",
                                })}
                            >
                                <span className="tile-title">{s.name}</span>
                                {filteredSizes.length === 1 && <span className="badge">自動選択</span>}
                            </div>
                        ))
                    ) : (
                        <div className="tile is-disabled">
                            <span className="tile-note">選べるサイズがありません</span>
                        </div>
                    )}
                </div>
                {order.itemSize === OTHER_OPTION && (
                    <input
                        className="other-input"
                        type="text"
                        placeholder="サイズを入力してください"
                        value={order.itemSizeOther}
                        onChange={(e) => onUpdate({ itemSizeOther: e.target.value })}
                    />
                )}
            </section>

            <section className={sectionClass(6)} ref={threadsRef}>
                <SectionTitle num={nextNum()} label="糸の色" en="Thread Colors" />
                {order.plan ? (
                    <ThreadSelector
                        limit={threadCount}
                        selected={order.threads}
                        colors={visibleThreads}
                        onToggle={handleThreadToggle}
                        onRandomize={handleThreadRandomize}
                    />
                ) : (
                    <div className="tile is-disabled">
                        <span className="tile-note">先にプランを選んでください</span>
                    </div>
                )}
            </section>

            <section className={sectionClass(7)} ref={soundCardRef}>
                <SectionTitle num={nextNum()} label="音が聴けるカード" en="Sound Card" optional />
                <div className={`sound-card-row ${order.soundCardQty > 0 ? "is-on" : ""}`}>
                    <div className="sound-card-info">
                        <span className="tile-title">音が聴けるカード</span>
                        <span className="tile-price">+¥{SOUND_CARD_UNIT_PRICE.toLocaleString()} / 枚</span>
                    </div>
                    <div className="qty-stepper">
                        <button
                            type="button"
                            className="qty-btn"
                            disabled={order.soundCardQty <= 0}
                            onClick={() => onUpdate({ soundCardQty: Math.max(0, order.soundCardQty - 1) })}
                            aria-label="減らす"
                        >
                            −
                        </button>
                        <span className="qty-value">{order.soundCardQty}</span>
                        <button
                            type="button"
                            className="qty-btn"
                            disabled={order.soundCardQty >= SOUND_CARD_MAX_QTY}
                            onClick={() => onUpdate({
                                soundCardQty: Math.min(SOUND_CARD_MAX_QTY, order.soundCardQty + 1),
                            })}
                            aria-label="増やす"
                        >
                            +
                        </button>
                    </div>
                </div>
            </section>

            <section className="form-section" ref={remarksRef}>
                <SectionTitle num={nextNum()} label="備考" en="Remarks" optional />
                <textarea
                    className="form-textarea"
                    placeholder="ご要望や特記事項があればご記入ください"
                    value={order.notes}
                    onChange={(e) => onUpdate({ notes: e.target.value })}
                />
            </section>
        </div>
    );
}
