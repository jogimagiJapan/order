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

    const DetailRow = ({ label, value }: { label: string; value: string }) => (
        <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
            <span className="admin-label">{label}</span>
            <span className="admin-value">{value}</span>
        </div>
    );
    const getThreadColor = (id: string) => THREAD_COLORS.find(c => c.id === id);

    return (
        <div className="bg-slate-50 min-h-screen pb-32">
            <div className="container py-8">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-xl font-black tracking-widest text-slate-800">ADMIN DASHBOARD</h1>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Last Update: {new Date().toLocaleTimeString()}
                    </div>
                </header>

                <main>
                    {/* Main Instruction Sheet */}
                    <section className="instruction-sheet mb-10 animate-fade-in">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <span className="admin-badge mb-3">NEW ORDER</span>
                                <h1 className="text-4xl font-black tracking-tighter text-slate-900">{current.selectedId}</h1>
                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">
                                    {new Date(current.timestamp).toLocaleString('ja-JP')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="admin-label mb-1">Total Amount</p>
                                <p className="text-4xl font-black text-slate-900 font-title">¥{current.totalPrice.toLocaleString()}</p>
                                <span className="text-[10px] font-bold text-accent-rose uppercase tracking-widest">Tax Included</span>
                            </div>
                        </div>

                        <div className="grid gap-1 mb-10">
                            <DetailRow label="Plan" value={current.plan} />
                            <DetailRow label="Item Type" value={current.item} />
                            <DetailRow label="Item Color" value={current.itemColor} />
                            <DetailRow label="Item Size" value={current.itemSize} />
                        </div>

                        <div className="mb-10">
                            <h3 className="admin-label mb-4">Required Threads</h3>
                            <div className="grid gap-3">
                                {[current.thread1, current.thread2, current.thread3].map((tid, i) => {
                                    const color = getThreadColor(tid);
                                    if (!tid || (current.plan === 'Lite' && i > 0)) return null;
                                    return (
                                        <div key={i} className="thread-row animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="chip-30" style={{ backgroundColor: color?.hex }} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black leading-tight text-slate-900">{tid}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{color?.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {current.notes && (
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                                <h3 className="admin-label mb-2">Remarks / Special Instructions</h3>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {current.notes}
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Quick Selection List */}
                    <section>
                        <h3 className="admin-label mb-4 ml-2">Quick Selection (Past 5)</h3>
                        <div className="history-list space-y-3">
                            {submissions.map((sub, idx) => (
                                <div
                                    key={idx}
                                    className={`history-item transition-all ${selectedIndex === idx ? "border-slate-900 ring-2 ring-slate-900/5 bg-slate-50" : "hover:bg-slate-50/50"}`}
                                    onClick={() => setSelectedIndex(idx)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-500">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-slate-900">{sub.selectedId}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(sub.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-900 uppercase">{sub.plan}</p>
                                        <p className="text-xs font-bold text-slate-400">¥{sub.totalPrice.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>

            {/* Floating Action Button */}
            <button
                className="admin-fab"
                onClick={() => window.location.reload()}
                title="Refresh Data"
            >
                <span className="text-2xl font-black">↺</span>
            </button>
        </div>
    );
}
