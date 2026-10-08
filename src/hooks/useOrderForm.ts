"use client";

import { useState, useEffect } from "react";
import { ACTIVE_GAS_URL } from "@/constants/gas";
import { resolveShippingFee } from "@/utils/shipping";
import { GPS_OPTION_PRICE } from "@/utils/gps";

export type Plan = "Lite" | "Limited" | "Std Wave" | "Std Circle";
export type PlanOption = "GPS日時" | "なし";
export type DeliveryMethod = "pickup" | "shipping";

export const OTHER_OPTION = "その他";
export const SOUND_CARD_UNIT_PRICE = 500;
export const SOUND_CARD_MAX_QTY = 10;

export const isStdPlan = (plan: Plan | null): boolean =>
    plan === "Std Wave" || plan === "Std Circle";

export const isBringInItem = (item: string): boolean => item === "持ち込み";

export function formatOtherValue(selected: string, other: string): string {
    if (selected === OTHER_OPTION) {
        const trimmed = other.trim();
        return trimmed ? `${OTHER_OPTION}（${trimmed}）` : OTHER_OPTION;
    }
    return selected;
}

export function formatSoundCardLabel(qty: number): string {
    return qty > 0 ? `${qty}枚` : "なし";
}

export interface MasterDataItem {
    name: string;
    price: number;
    note?: string;
    associatedItems: string[];
}

export interface ShippingInfo {
    zip: string;
    address: string;
    building: string;
    name: string;
    phone: string;
    email: string;
    isRemoteManual: boolean;
}

export interface OrderState {
    selectedId: string;
    plan: Plan | null;
    option: PlanOption | "";
    gpsDatetime: string;
    gpsLocation: string;
    item: string;
    itemColor: string;
    itemColorOther: string;
    itemSize: string;
    itemSizeOther: string;
    threads: string[];
    soundCardQty: number;
    notes: string;
    deliveryMethod: DeliveryMethod | "";
    shipping: ShippingInfo;
    shippingFee: number;
    totalPrice: number;
}

export interface MasterData {
    items: MasterDataItem[];
    colors: MasterDataItem[];
    sizes: MasterDataItem[];
    shipping: MasterDataItem[];
    threads: MasterDataItem[];
    gpsLocationDefault: string;
}

const EMPTY_SHIPPING: ShippingInfo = {
    zip: "",
    address: "",
    building: "",
    name: "",
    phone: "",
    email: "",
    isRemoteManual: false,
};

const EMPTY_MASTER: MasterData = {
    items: [],
    colors: [],
    sizes: [],
    shipping: [],
    threads: [],
    gpsLocationDefault: "",
};

function calcOrderTotal(
    order: OrderState,
    items: MasterDataItem[],
): number {
    let total = 0;
    if (order.plan === "Lite" || order.plan === "Limited") total = 2000;
    else if (isStdPlan(order.plan)) total = 4000;

    const itemPrice = items.find(i => i.name === order.item)?.price || 0;
    const cardPrice = (order.soundCardQty || 0) * SOUND_CARD_UNIT_PRICE;
    const gpsPrice = order.option === "GPS日時" ? GPS_OPTION_PRICE : 0;
    return total + itemPrice + cardPrice + gpsPrice + order.shippingFee;
}

function parseMasterPayload(raw: Partial<MasterData> & {
    gpsConfig?: MasterDataItem[];
}): MasterData {
    const gpsConfig = raw.gpsConfig || [];
    const locationRow = gpsConfig.find(r => r.name === "緯度経度");
    return {
        items: raw.items || [],
        colors: raw.colors || [],
        sizes: raw.sizes || [],
        shipping: raw.shipping || [],
        threads: raw.threads || [],
        gpsLocationDefault: String(locationRow?.note || "").trim(),
    };
}

export function useOrderForm() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<{ fullName: string; friendlyId: string; url: string }[]>([]);
    const [masterData, setMasterData] = useState<MasterData>(EMPTY_MASTER);

    const [order, setOrder] = useState<OrderState>({
        selectedId: "",
        plan: null,
        option: "",
        gpsDatetime: "",
        gpsLocation: "",
        item: "",
        itemColor: "",
        itemColorOther: "",
        itemSize: "",
        itemSizeOther: "",
        threads: [],
        soundCardQty: 0,
        notes: "",
        deliveryMethod: "",
        shipping: { ...EMPTY_SHIPPING },
        shippingFee: 0,
        totalPrice: 0,
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(ACTIVE_GAS_URL);
                const data = await res.json();
                setFiles(data.latestFiles);
                setMasterData(parseMasterPayload(data.masterData || {}));
            } catch (err) {
                console.error("Failed to fetch master data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const updateOrder = (updates: Partial<OrderState>) => {
        setOrder((prev) => {
            const next = { ...prev, ...updates };

            next.shippingFee = next.deliveryMethod === "shipping"
                ? resolveShippingFee(next.shipping.zip, next.shipping.isRemoteManual, masterData.shipping)
                : 0;

            next.totalPrice = calcOrderTotal(next, masterData.items);

            return next;
        });
    };

    const updateShipping = (updates: Partial<ShippingInfo>) => {
        setOrder((prev) => {
            const shipping = { ...prev.shipping, ...updates };
            const next = { ...prev, shipping };

            next.shippingFee = next.deliveryMethod === "shipping"
                ? resolveShippingFee(shipping.zip, shipping.isRemoteManual, masterData.shipping)
                : 0;

            next.totalPrice = calcOrderTotal(next, masterData.items);

            return next;
        });
    };

    const nextStep = () => setStep((s) => s + 1);
    const prevStep = () => setStep((s) => s - 1);

    return {
        step,
        setStep,
        loading,
        files,
        masterData,
        order,
        updateOrder,
        updateShipping,
        nextStep,
        prevStep
    };
}
