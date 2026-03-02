"use client";

import { useState } from "react";
import { useOrderForm } from "@/hooks/useOrderForm";
import Step1_IDSelection from "@/components/Step1_IDSelection";
import Step2_DetailsSelection from "@/components/Step2_DetailsSelection";
import Step3_Preview from "@/components/Step3_Preview";
import { GAS_URL } from "@/constants/gas";

export default function OrderPage() {
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(order),
      });
      const result = await response.json();
      if (result.result === "success") {
        setIsSuccess(true);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      alert("送信に失敗しました。電波状況を確認してください。\n" + err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={() => window.location.href = "https://sts-process-visualization.jogimagi.com/"}
        >
          VIEW MAKING PROCESS
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
      <div className="container">
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
              onSelect={(id) => {
                updateOrder({ selectedId: id });
                nextStep();
              }}
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
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          )}
        </main>
      </div>

      {/* Navigation Footer */}
      {step > 1 && !isSuccess && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-base-bg/80 backdrop-blur-md border-t border-border flex gap-4 max-w-[550px] mx-auto right-0 z-50">
          <button
            className="flex-1 p-4 rounded-xl border border-border bg-white font-bold text-xs tracking-widest text-sub shadow-sm active:scale-95 transition-all"
            onClick={prevStep}
          >
            BACK
          </button>
          {step === 2 && (
            <button
              className="flex-1 p-4 rounded-xl bg-text-main text-white font-bold text-xs tracking-widest shadow-md disabled:opacity-20 active:scale-95 transition-all"
              disabled={!order.plan || !order.item || !order.thread1}
              onClick={nextStep}
            >
              CONTINUE
            </button>
          )}
        </div>
      )}
    </div>
  );
}
