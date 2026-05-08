"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useOrderForm } from "@/hooks/useOrderForm";
import Step1_IDSelection from "@/components/Step1_IDSelection";
import Step2_DetailsSelection from "@/components/Step2_DetailsSelection";
import Step3_Preview from "@/components/Step3_Preview";
import { ACTIVE_GAS_URL } from "@/constants/gas";

// Exported default wraps inner component in Suspense to satisfy Next.js prerender requirements for useSearchParams
export default function OrderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-bold tracking-widest text-sub">LOADING...</div>}>
      <OrderPageInner />
    </Suspense>
  );
}

function OrderPageInner() {
  const {
    step,
    setStep,
    loading,
    files,
    masterData,
    order,
    updateOrder,
    nextStep,
    prevStep,
  } = useOrderForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fromQR, setFromQR] = useState(false);
  const [showStaffConfirmation, setShowStaffConfirmation] = useState(false);
  const [isStaffConfirmed, setIsStaffConfirmed] = useState(false);
  const searchParams = useSearchParams();

  // URL Parameter Handling
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && !order.selectedId) {
      updateOrder({ selectedId: idParam });
      setFromQR(true);
    }
  }, [searchParams, updateOrder, order.selectedId]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Map threads array to thread1, 2, 3 for GAS backend compatibility
      const submissionData = {
        ...order,
        thread1: order.threads[0] || "",
        thread2: order.threads[1] || "",
        thread3: order.threads[2] || "",
      };

      const response = await fetch(ACTIVE_GAS_URL, {
        method: "POST",
        body: JSON.stringify(submissionData),
      });
      const result = await response.json();
      if (result.result === "success") {
        setIsSuccess(true);
      } else {
        alert("Submission failed: " + result.error);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Error submitting order. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const threadLimit = order.plan === "Lite" ? 1 : 3;
  const isStep2Valid =
    order.plan &&
    order.item &&
    order.itemColor &&
    order.itemSize &&
    order.threads.length === threadLimit &&
    order.threads.every(t => t !== "");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-bold tracking-widest text-sub">
        LOADING...
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="success-screen">
        <div className="success-card">
          <div className="success-icon-container shadow-inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          
          <h1 className="text-3xl font-black tracking-[0.2em] mb-4 text-text-main">THANK YOU</h1>
          
          <div className="w-12 h-0.5 bg-accent-gold/30 mx-auto mb-6"></div>
          
          <p className="text-sub mb-10 leading-relaxed font-medium">
            ご注文を承りました。<br />
            仕上がりまで、どうぞ楽しみにお待ちください。
          </p>

          <div className="space-y-4">
            <button
              className="finalize-btn w-full"
              style={{ backgroundColor: "#c06c84", boxShadow: '0 10px 20px rgba(192, 108, 132, 0.2)' }}
              onClick={() => window.location.href = "https://sts-process-visualization.jogimagi.com/"}
            >
              音の刺繍について
            </button>
            
            <button
              className="btn-home"
              onClick={() => window.location.reload()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-bg">
      <div className={`container ${step === 3 ? "container-wide" : ""}`}>
        <header className="mb-12 text-center pt-8">
          <h1 className="text-2xl font-black tracking-[0.2em] text-text-main">SEW THE SOUND</h1>
          <div className="flex justify-center gap-3 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${step === s ? "bg-accent-gold w-8" : step > s ? "bg-text-main" : "bg-border"}`}
              />
            ))}
          </div>
        </header>

        <main>
          {step === 1 && (
            <Step1_IDSelection
              files={files}
              selectedId={order.selectedId}
              fromQR={fromQR}
              onSelect={(id) => {
                setFromQR(false);
                updateOrder({ selectedId: id });
              }}
              onNext={nextStep}
            />
          )}

          {step === 2 && (
            <Step2_DetailsSelection
              order={order}
              masterData={masterData}
              onUpdate={updateOrder}
            />
          )}

          {step === 3 && (
            <Step3_Preview
              order={order}
            />
          )}
        </main>
      </div>

      {/* Refined Navigation Footer */}
      {step > 1 && !isSuccess && (
        <div className="nav-container">
          <div className="nav-inner">
            <button className="btn-nav btn-back" onClick={prevStep} disabled={isSubmitting}>
              <span>←</span> BACK
            </button>

            {step === 2 && (
              <button
                className="btn-nav btn-continue"
                disabled={!isStep2Valid}
                onClick={nextStep}
              >
                CONTINUE <span>→</span>
              </button>
            )}

            {step === 3 && (
              <button
                className="btn-nav btn-continue"
                disabled={isSubmitting}
                onClick={() => {
                  setShowStaffConfirmation(true);
                  setIsStaffConfirmed(false);
                }}
                style={{ backgroundColor: '#c06c84', minWidth: '160px' }}
              >
                決定 →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Staff Confirmation Modal */}
      {showStaffConfirmation && !isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-border">
            <div className="text-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold mx-auto mb-4">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <h3 className="text-lg font-black tracking-wider text-text-main mb-2">スタッフ確認</h3>
              <p className="text-sm text-sub font-medium leading-relaxed">
                この画面をスタッフに提示してください。<br/>
                （ここからはスタッフが操作します）
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              {!isStaffConfirmed ? (
                <button 
                  className="w-full py-3.5 rounded-full font-bold text-white transition-all transform active:scale-95"
                  style={{ backgroundColor: '#c06c84', boxShadow: '0 4px 10px rgba(192, 108, 132, 0.3)' }}
                  onClick={() => setIsStaffConfirmed(true)}
                >
                  確認
                </button>
              ) : (
                <button 
                  className="w-full py-3.5 rounded-full font-bold text-white transition-all transform active:scale-95"
                  style={{ backgroundColor: '#c06c84', boxShadow: '0 4px 10px rgba(192, 108, 132, 0.3)' }}
                  onClick={() => {
                    handleSubmit();
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "送信中..." : "決定"}
                </button>
              )}
              
              <button 
                className="w-full py-3.5 rounded-full font-bold text-sub bg-gray-50 hover:bg-gray-100 border border-border transition-all transform active:scale-95"
                onClick={() => {
                  setShowStaffConfirmation(false);
                  setIsStaffConfirmed(false);
                }}
                disabled={isSubmitting}
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
