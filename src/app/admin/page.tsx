"use client";

import { useState, useEffect } from "react";
import { THREAD_COLORS } from "@/constants/colors";
import { GAS_URL } from "@/constants/gas";

interface Submission {
    timestamp: string;
    selectedId: string;
    plan: string;
    item: string;
    itemColor: string;
    itemSize: string;
    thread1: string;
    thread2: string;
    thread3: string;
    notes: string;
    totalPrice: number;
    status: string;
}

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(GAS_URL);
                const data = await res.json();
                setSubmissions(data.submissions || []);
            } catch (err) {
                console.error("Failed to fetch submissions", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <div className="flex h-screen items-center justify-center font-bold text-sub">LOADING DASHBOARD...</div>;

    const current = submissions[selectedIndex];

    if (!current) {
        return (
            <div className="container py-20 text-center">
                <h1 className="mb-4">ADMIN DASHBOARD</h1>
                <p className="text-sub">No submissions found.</p>
            </div>
        );
    }

    const getThreadColor = (id: string) => THREAD_COLORS.find(c => c.id === id);

    return (
        <div className="container py-8 bg-[#f8f9fa] min-h-screen">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-lg">ADMIN DASHBOARD</h1>
                <button
                    className="text-xs bg-white border px-3 py-1 rounded-full font-bold"
                    onClick={() => window.location.reload()}
                >
                    REFRESH
                </button>
            </header>

            <main>
                {/* Main Card */}
                <section className="bg-white rounded-3xl p-8 shadow-sm border mb-8 animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="badge mb-2">{current.status}</span>
                            <h2 className="text-3xl font-bold">{current.selectedId}</h2>
                            <p className="text-xs text-sub">{new Date(current.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-sub">TOTAL</p>
                            <p className="text-2xl font-bold">¥{current.totalPrice.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-2 gap-8 mb-8">
                        <div>
                            <p className="text-[10px] font-bold text-sub uppercase mb-1">Plan</p>
                            <p className="font-bold">{current.plan}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-sub uppercase mb-1">Item</p>
                            <p className="font-bold">{current.item} / {current.itemColor} / {current.itemSize}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-[10px] font-bold text-sub uppercase mb-3">Threads</p>
                        <div className="flex gap-6">
                            {[current.thread1, current.thread2, current.thread3].map((tid, i) => {
                                const color = getThreadColor(tid);
                                if (!tid || (current.plan === 'Lite' && i > 0)) return null;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="w-12 h-12 rounded-full border-2" style={{ backgroundColor: color?.hex }} />
                                        <span className="text-xs font-bold">{tid}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {current.notes && (
                        <div className="bg-base-bg p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-sub uppercase mb-1">Remarks</p>
                            <p className="text-sm">{current.notes}</p>
                        </div>
                    )}
                </section>

                {/* Quick Selection */}
                <h3 className="text-xs font-bold text-sub mb-4 tracking-widest uppercase">Quick Selection (Past 5)</h3>
                <div className="grid gap-3">
                    {submissions.map((sub, idx) => (
                        <div
                            key={idx}
                            className={`p-4 rounded-2xl border bg-white flex justify-between items-center cursor-pointer transition-all ${selectedIndex === idx ? "border-primary ring-1 ring-primary" : "opacity-70"}`}
                            onClick={() => setSelectedIndex(idx)}
                        >
                            <div>
                                <p className="font-bold text-sm">{sub.selectedId}</p>
                                <p className="text-[10px] text-sub">{new Date(sub.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold">{sub.plan}</p>
                                <p className="text-[10px] text-sub">¥{sub.totalPrice.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
