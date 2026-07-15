"use client";

import { useState, useEffect } from "react";
import { ACTIVE_GAS_URL } from "@/constants/gas";

export type Plan = "Lite" | "Limited" | "Std Wave" | "Std Circle";
export type PlanOption = "GPS日時" | "なし";

export const isStdPlan = (plan: Plan | null): boolean =>
    plan === "Std Wave" || plan === "Std Circle";

export interface MasterDataItem {
    name: string;
    price: number;
    note?: string;
    associatedItems: string[];
}

export interface OrderState {
    selectedId: string;
    plan: Plan | null;
    option: PlanOption | "";
    item: string;
    itemColor: string;
    itemSize: string;
    threads: string[]; // Changed from thread1,2,3 to an array
    notes: string;
    totalPrice: number;
}

export function useOrderForm() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<{ fullName: string; friendlyId: string; url: string }[]>([]);
    const [masterData, setMasterData] = useState<{
        items: MasterDataItem[];
        colors: MasterDataItem[];
        sizes: MasterDataItem[];
    }>({ items: [], colors: [], sizes: [] });

    const [order, setOrder] = useState<OrderState>({
        selectedId: "",
        plan: null,
        option: "",
        item: "",
        itemColor: "",
        itemSize: "",
        threads: [],
        notes: "",
        totalPrice: 0,
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(ACTIVE_GAS_URL);
                const data = await res.json();
                setFiles(data.latestFiles);
                setMasterData(data.masterData);
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
            // Calculation logic
            let total = 0;
            if (next.plan === "Lite" || next.plan === "Limited") total = 2000;
            else if (isStdPlan(next.plan)) total = 4000;

            const itemPrice = masterData.items.find(i => i.name === next.item)?.price || 0;
            next.totalPrice = total + itemPrice;

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
        nextStep,
        prevStep
    };
}
