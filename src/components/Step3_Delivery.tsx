"use client";

import { useEffect, useRef, useState } from "react";
import { DeliveryMethod, MasterDataItem, OrderState, ShippingInfo } from "@/hooks/useOrderForm";
import {
    getShippingRates,
    isRemoteZip,
    isValidEmail,
    isValidPhone,
    isValidZip,
    normalizeZip,
} from "@/utils/shipping";

interface FieldConfig {
    key: keyof ShippingInfo;
    label: string;
    hint?: string;
    placeholder: string;
    inputMode?: "text" | "numeric" | "tel" | "email";
    type?: string;
    autoComplete?: string;
    value: string;
    visible: boolean;
    done: boolean;
    onChange: (value: string) => void;
}

export default function Step3_Delivery({
    order,
    masterData,
    onUpdate,
    onUpdateShipping,
}: {
    order: OrderState;
    masterData: { shipping: MasterDataItem[] };
    onUpdate: (updates: Partial<OrderState>) => void;
    onUpdateShipping: (updates: Partial<ShippingInfo>) => void;
}) {
    const formRef = useRef<HTMLElement>(null);
    const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [buildingSkipped, setBuildingSkipped] = useState(false);

    const shipping = order.shipping;
    const isShipping = order.deliveryMethod === "shipping";

    const zipDone = isValidZip(shipping.zip);
    const addressDone = zipDone && shipping.address.trim() !== "";
    const buildingDone = addressDone && (shipping.building.trim() !== "" || buildingSkipped);
    const nameDone = buildingDone && shipping.name.trim() !== "";
    const phoneDone = nameDone && isValidPhone(shipping.phone);
    const emailDone = phoneDone && isValidEmail(shipping.email);

    const fields: FieldConfig[] = [
        {
            key: "zip",
            label: "郵便番号",
            hint: "ハイフンなしの7桁",
            placeholder: "1000001",
            inputMode: "numeric",
            autoComplete: "postal-code",
            value: shipping.zip,
            visible: true,
            done: zipDone,
            onChange: (v) => onUpdateShipping({ zip: normalizeZip(v) }),
        },
        {
            key: "address",
            label: "住所",
            hint: "都道府県から番地まで",
            placeholder: "東京都千代田区千代田1-1",
            autoComplete: "street-address",
            value: shipping.address,
            visible: zipDone,
            done: addressDone,
            onChange: (v) => onUpdateShipping({ address: v }),
        },
        {
            key: "building",
            label: "建物名・部屋番号",
            hint: "任意",
            placeholder: "◯◯マンション 101",
            value: shipping.building,
            visible: addressDone,
            done: buildingDone,
            onChange: (v) => onUpdateShipping({ building: v }),
        },
        {
            key: "name",
            label: "お名前",
            placeholder: "音符 太郎",
            autoComplete: "name",
            value: shipping.name,
            visible: buildingDone,
            done: nameDone,
            onChange: (v) => onUpdateShipping({ name: v }),
        },
        {
            key: "phone",
            label: "電話番号",
            hint: "ハイフンなし",
            placeholder: "09012345678",
            inputMode: "tel",
            autoComplete: "tel",
            value: shipping.phone,
            visible: nameDone,
            done: phoneDone,
            onChange: (v) => onUpdateShipping({ phone: v.replace(/[^\d]/g, "") }),
        },
        {
            key: "email",
            label: "メールアドレス",
            hint: "配送のご連絡をお送りします",
            placeholder: "example@mail.com",
            inputMode: "email",
            type: "email",
            autoComplete: "email",
            value: shipping.email,
            visible: phoneDone,
            done: emailDone,
            onChange: (v) => onUpdateShipping({ email: v.trim() }),
        },
    ];

    const visibleFields = isShipping ? fields.filter(f => f.visible) : [];
    const lastVisibleKey = visibleFields.length > 0
        ? visibleFields[visibleFields.length - 1].key
        : "";

    // Bring the newly revealed field into view
    useEffect(() => {
        if (!isShipping || !lastVisibleKey || lastVisibleKey === "zip") return;
        const timer = setTimeout(() => {
            fieldRefs.current[lastVisibleKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
        return () => clearTimeout(timer);
    }, [isShipping, lastVisibleKey]);

    useEffect(() => {
        if (!isShipping) return;
        const timer = setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
        return () => clearTimeout(timer);
    }, [isShipping]);

    const rates = getShippingRates(masterData.shipping);
    const isRemote = shipping.isRemoteManual || isRemoteZip(shipping.zip, rates.remotePrefixes);

    const selectMethod = (method: DeliveryMethod) => {
        if (method === "pickup") {
            onUpdate({
                deliveryMethod: "pickup",
                shipping: {
                    zip: "",
                    address: "",
                    building: "",
                    name: "",
                    phone: "",
                    email: "",
                    isRemoteManual: false,
                },
            });
            setBuildingSkipped(false);
            return;
        }
        onUpdate({ deliveryMethod: "shipping" });
    };

    return (
        <div className="animate-fade-in step-delivery">
            <header className="mb-10 text-center">
                <h2 className="mb-2">03. Delivery</h2>
                <p className="text-sub">お渡し方法を選択してください</p>
            </header>

            <section className={`mb-16 ${!order.deliveryMethod ? "focused-section" : ""}`}>
                <h3 className="section-title">03-1. RECEIVE METHOD</h3>
                <div className="grid grid-2">
                    <div
                        className={`tile ${order.deliveryMethod === "pickup" ? "active" : ""}`}
                        onClick={() => selectMethod("pickup")}
                    >
                        <span className="tile-title">本日お渡し</span>
                        <span className="tile-note">店頭でお渡し</span>
                    </div>
                    <div
                        className={`tile ${order.deliveryMethod === "shipping" ? "active" : ""}`}
                        onClick={() => selectMethod("shipping")}
                    >
                        <span className="tile-title">後日配送</span>
                        <span className="tile-note">ご自宅へお届け</span>
                    </div>
                </div>
            </section>

            {isShipping && (
                <section className="mb-16" ref={formRef}>
                    <h3 className="section-title">03-2. SHIPPING ADDRESS</h3>

                    <div className="ship-form">
                        {visibleFields.map((field) => (
                            <div
                                key={field.key}
                                className="ship-field animate-fade-in"
                                ref={(el) => {
                                    fieldRefs.current[field.key] = el;
                                }}
                            >
                                <label className="ship-label" htmlFor={`ship-${field.key}`}>
                                    {field.label}
                                    {field.hint && <span className="ship-hint">{field.hint}</span>}
                                </label>
                                <input
                                    id={`ship-${field.key}`}
                                    className={`ship-input ${field.done ? "is-done" : ""}`}
                                    type={field.type || "text"}
                                    inputMode={field.inputMode}
                                    autoComplete={field.autoComplete}
                                    placeholder={field.placeholder}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                />

                                {field.key === "zip" && zipDone && (
                                    <label className="ship-check">
                                        <input
                                            type="checkbox"
                                            checked={shipping.isRemoteManual}
                                            onChange={(e) =>
                                                onUpdateShipping({ isRemoteManual: e.target.checked })
                                            }
                                        />
                                        <span>離島に該当する（送料が加算されます）</span>
                                    </label>
                                )}

                                {field.key === "building" && !buildingDone && (
                                    <button
                                        type="button"
                                        className="ship-skip"
                                        onClick={() => setBuildingSkipped(true)}
                                    >
                                        建物名なしで次へ
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {zipDone && (
                        <div className="ship-fee animate-fade-in">
                            <div className="ship-fee-text">
                                <span className="ship-fee-label">送料</span>
                                <span className="ship-fee-note">
                                    {isRemote ? "北海道・沖縄・離島" : "全国一律"}
                                </span>
                            </div>
                            <span className="ship-fee-amount">
                                ＋¥{order.shippingFee.toLocaleString()}
                            </span>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
