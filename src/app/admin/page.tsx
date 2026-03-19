"use client";

import { useState, useEffect } from "react";
import { THREAD_COLORS } from "@/constants/colors";
import { ACTIVE_GAS_URL } from "@/constants/gas";

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
    const [refreshing, setRefreshing] = useState(false);
    const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Load completed status from localStorage
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

    if (loading) return (
        <div className="flex h-screen items-center justify-center font-bold text-slate-400 gap-4">
            <div className="spinner" style={{ width: 24, height: 24 }}></div>
            LOADING DASHBOARD...
        </div>
    );

    const current = submissions[selectedIndex];

    if (!current) {
        return (
            <div className="container py-20 text-center">
                <h1 className="mb-4">DASHBOARD</h1>
                <p className="text-sub">No submissions found.</p>
            </div>
        );
    }

    const getThreadColor = (id: string) => THREAD_COLORS.find(c => c.id === id);
    const isCompleted = completedIds[current.selectedId] || false;

    return (
        <div className="bg-slate-50 min-h-screen pb-32">
            <div className="container py-6">
                <header className="mb-6 flex justify-between items-center px-2">
                    <h1 className="text-xl font-black tracking-widest text-slate-800">DASHBOARD</h1>
                    <div className="text-right">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(current.timestamp).toLocaleDateString('ja-JP')}
                        </div>
                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                            {new Date(current.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </header>

                <main>
                    {/* Main Instruction Sheet */}
                    <section className={`instruction-sheet mb-8 animate-fade-in ${isCompleted ? 'is-completed' : ''}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex-1">
                                <span className="admin-badge mb-3">{isCompleted ? 'COMPLETED' : 'NEW ORDER'}</span>
                                <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">{current.selectedId}</h1>
                            </div>
                            <div className="text-right flex flex-col items-end gap-3">
                                <div>
                                    <p className="text-4xl font-black text-slate-900 font-title leading-none">¥{current.totalPrice.toLocaleString()}</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-4 py-2 rounded-full active:scale-95 transition-transform">
                                    <input
                                        type="checkbox"
                                        checked={isCompleted}
                                        onChange={() => toggleCompleted(current.selectedId)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-[10px] font-black text-slate-600 tracking-widest">作業完了</span>
                                </label>
                            </div>
                        </div>

                        {/* High-Density Grid */}
                        <div className="grid gap-3 mb-8">
                            <div className="admin-grid-2">
                                <div className="admin-grid-val">
                                    <p className="value">{current.plan}</p>
                                    <p className="label-small">Plan</p>
                                </div>
                                <div className="admin-grid-val">
                                    <p className="value">{current.item}</p>
                                    <p className="label-small">Item</p>
                                </div>
                            </div>
                            <div className="admin-grid-2">
                                <div className="admin-grid-val">
                                    <p className="value">{current.itemColor}</p>
                                    <p className="label-small">Color</p>
                                </div>
                                <div className="admin-grid-val">
                                    <p className="value">{current.itemSize}</p>
                                    <p className="label-small">Size</p>
                                </div>
                            </div>
                        </div>

                        {/* Thread Selection Alignment with Step 3 */}
                        <div className="mb-8">
                            <h3 className="admin-label mb-6 border-b border-slate-100 pb-2">Thread Selection</h3>
                            <div className="thread-preview-grid">
                                {[current.thread1, current.thread2, current.thread3].map((tid, i) => {
                                    const color = getThreadColor(tid);
                                    if (!tid || (current.plan === 'Lite' && i > 0)) return null;
                                    return (
                                        <div key={i} className="thread-preview-item">
                                            <span className="text-[11px] font-black leading-none mb-2 text-slate-900">{tid}</span>
                                            <div
                                                className="color-dot-large"
                                                style={{ backgroundColor: color?.hex, width: 60, height: 60 }}
                                            />
                                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-2">{color?.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {current.notes && (
                            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                                <h3 className="admin-label mb-2">Remarks</h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-bold">
                                    {current.notes}
                                </p>
                            </div>
                        )}
                    </section>

                    {/* Quick Selection List */}
                    <section>
                        <h3 className="admin-label mb-4 ml-2">History</h3>
                        <div className="history-list space-y-2">
                            {submissions.map((sub, idx) => {
                                const subCompleted = completedIds[sub.selectedId] || false;
                                return (
                                    <div
                                        key={idx}
                                        className={`history-item transition-all ${selectedIndex === idx ? "border-slate-900 ring-2 ring-slate-900/5 bg-slate-50" : "hover:bg-slate-50/50"} ${subCompleted ? 'opacity-40 grayscale' : ''}`}
                                        onClick={() => setSelectedIndex(idx)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-slate-900">{sub.selectedId}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-900 uppercase">{sub.plan}</p>
                                            <p className="text-xs font-bold text-slate-400">¥{sub.totalPrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </main>
            </div>

            {/* Floating Action Button with Loading Feedback */}
            <button
                className="admin-fab"
                onClick={fetchData}
                disabled={refreshing}
                title="Refresh Data"
            >
                {refreshing ? (
                    <div className="spinner" style={{ width: 24, height: 24, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }}></div>
                ) : (
                    <span className="text-2xl font-black">↺</span>
                )}
            </button>
        </div>
    );
}
