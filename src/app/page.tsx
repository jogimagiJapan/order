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
    // ULTIMATE DEBUG ALERT (BUILD: 2026-03-19 09:15)
    if (typeof window !== "undefined") {
      const debugInfo = {
        activeGASUrl: ACTIVE_GAS_URL,
        firstFileFromGAS: files[0] || "No files loaded",
        orderStateBeforeSend: order,
        submissionData: {
          ...order,
          thread1: order.threads[0] || "",
          thread2: order.threads[1] || "",
          thread3: order.threads[2] || "",
        }
      };
      window.alert("【ULTIMATE DEBUG】\n" + JSON.stringify(debugInfo, null, 2));
    }
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
      <div className="container animate-fade-in flex flex-col items-center justify-center text-center min-h-[80vh]">
        <div className="w-24 h-24 bg-white border border-border text-accent-blue rounded-full flex items-center justify-center mb-8 text-4xl shadow-sm">
          ✓
        </div>
        <h1 className="text-3xl mb-4">THANK YOU</h1>
        <p className="text-sub mb-10 leading-relaxed">
          ご注文を承りました。<br />
          あなたの音が形になるまで、もう少々お待ちください。<br />
          制作過程は以下のボタンよりご確認いただけます。
        </p>
        <button
          className="submit-btn mb-6"
          style={{ backgroundColor: "#c06c84" }}
          onClick={() => window.location.href = "https://sts-process-visualization.jogimagi.com/"}
        >
          音の刺繍について
        </button>
        <button
          className="text-sub underline text-xs tracking-widest opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => window.location.reload()}
        >
          HOME
        </button>
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
                onClick={handleSubmit}
                style={{ backgroundColor: '#c06c84', minWidth: '160px' }}
              >
                {isSubmitting ? "WAIT..." : "決定 →"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
