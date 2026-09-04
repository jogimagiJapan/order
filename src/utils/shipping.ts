/**
 * Shipping fee resolution.
 * Rates and target postal codes are managed in the "マスタデータ" sheet
 * (category "Shipping"); the constants below are only used until that
 * sheet is reachable.
 */

import type { MasterDataItem, ShippingInfo } from "@/hooks/useOrderForm";

export const REMOTE_RATE_NAME = "遠方送料";
export const NORMAL_RATE_NAME = "通常送料";

/** 北海道 (00x, 04x-09x) / 沖縄 (90x) and major remote islands. */
const FALLBACK_REMOTE_PREFIXES = [
    "00", "04", "05", "06", "07", "08", "09", "90",
    "685", "817", "853", "894", "8913", "8914", "952", "10021",
];

const FALLBACK_REMOTE_FEE = 1000;
const FALLBACK_NORMAL_FEE = 0;

export interface ShippingRates {
    remoteFee: number;
    normalFee: number;
    remotePrefixes: string[];
}

export function getShippingRates(shippingMaster: MasterDataItem[]): ShippingRates {
    const remote = shippingMaster.find(s => s.name === REMOTE_RATE_NAME);
    const normal = shippingMaster.find(s => s.name === NORMAL_RATE_NAME);

    const prefixes = (remote?.associatedItems ?? [])
        .map(p => p.replace(/\D/g, ""))
        .filter(Boolean);

    return {
        remoteFee: remote?.price ?? FALLBACK_REMOTE_FEE,
        normalFee: normal?.price ?? FALLBACK_NORMAL_FEE,
        remotePrefixes: prefixes.length > 0 ? prefixes : FALLBACK_REMOTE_PREFIXES,
    };
}

export function normalizeZip(zip: string): string {
    return zip.replace(/\D/g, "").slice(0, 7);
}

export function isRemoteZip(zip: string, remotePrefixes: string[]): boolean {
    const digits = normalizeZip(zip);
    if (digits.length < 3) return false;
    return remotePrefixes.some(prefix => digits.startsWith(prefix));
}

export function resolveShippingFee(
    zip: string,
    isRemoteManual: boolean,
    shippingMaster: MasterDataItem[]
): number {
    const rates = getShippingRates(shippingMaster);
    if (isRemoteManual) return rates.remoteFee;
    return isRemoteZip(zip, rates.remotePrefixes) ? rates.remoteFee : rates.normalFee;
}

export const isValidZip = (zip: string): boolean => normalizeZip(zip).length === 7;

export const isValidPhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 11;
};

export const isValidEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function isShippingComplete(shipping: ShippingInfo): boolean {
    return (
        isValidZip(shipping.zip) &&
        shipping.address.trim() !== "" &&
        shipping.name.trim() !== "" &&
        isValidPhone(shipping.phone) &&
        isValidEmail(shipping.email)
    );
}
