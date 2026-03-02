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
      <div className="container animate-fade-in flex flex-col items-center justify-center text-center h-full">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 text-3xl">
          ✓
        </div>
        <h1 className="mb-2">THANK YOU!</h1>
        <p className="text-sub mb-8">
          ご注文を承りました。<br />
          制作過程は以下のリンクよりご確認いただけます。
        </p>
        <button
          className="submit-btn mb-4"
          onClick={() => window.location.href = "https://sts-process-visualization.jogimagi.com/"}
        >
          MAKING PROCESS
        </button>
        <button
          className="text-sub underline text-xs"
          onClick={() => window.location.reload()}
        >
          ホームへ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="container pb-24">
        <header className="mb-8 text-center pt-4">
          <h1 className="text-xl">SEW THE SOUND</h1>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${step >= s ? "bg-primary" : "bg-border"}`}
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
        <div className="fixed bottom-0 left-0 w-full p-6 bg-white border-t flex gap-4 max-w-[500px] mx-auto right-0">
          <button
            className="flex-1 p-4 rounded-xl border font-bold text-sm"
            onClick={prevStep}
          >
            BACK
          </button>
          {step === 2 && (
            <button
              className="flex-1 p-4 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-30"
              disabled={!order.plan || !order.item || !order.thread1}
              onClick={nextStep}
            >
              NEXT
            </button>
          )}
        </div>
      )}
    </div>
  );
}
