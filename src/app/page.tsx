"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  useOrderForm,
  OTHER_OPTION,
  isBringInItem,
  formatOtherValue,
} from "@/hooks/useOrderForm";
import { isValidGpsText } from "@/utils/gps";
import Step1_IDSelection from "@/components/Step1_IDSelection";
import Step2_DetailsSelection from "@/components/Step2_DetailsSelection";
import Step3_Delivery from "@/components/Step3_Delivery";
import Step4_Preview from "@/components/Step4_Preview";
import { ACTIVE_GAS_URL } from "@/constants/gas";
import { isShippingComplete } from "@/utils/shipping";
import { threadLimitFor } from "@/utils/plan";
import BrandTitle from "@/components/BrandTitle";

const STEP_LABELS = ["ID", "カスタマイズ", "お渡し", "確認"];

// Exported default wraps inner component in Suspense to satisfy Next.js prerender requirements for useSearchParams
export default function OrderPage() {
  return (
    <Suspense fallback={<div className="order-app order-loading"><span className="order-loading-text">読み込み中...</span></div>}>
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
    updateShipping,
    nextStep,
    prevStep,
  } = useOrderForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fromQR, setFromQR] = useState(false);
  const [showStaffConfirmation, setShowStaffConfirmation] = useState(false);
  const [isStaffConfirmed, setIsStaffConfirmed] = useState(false);
  const [staffModalStep, setStaffModalStep] = useState<"confirm" | "pick" | "review">("confirm");
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const searchParams = useSearchParams();

  const TICKET_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

  const resetStaffFlow = () => {
    setShowStaffConfirmation(false);
    setIsStaffConfirmed(false);
    setStaffModalStep("confirm");
    setTicketNumber(null);
  };

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

  const handleSubmit = async (ticket: number) => {
    if (!(ticket >= 1 && ticket <= 6)) {
      alert("整理番号を1〜6から選んでください");
      return;
    }
    setIsSubmitting(true);
    try {
      const itemColor = isBringInItem(order.item)
        ? ""
        : formatOtherValue(order.itemColor, order.itemColorOther);
      const itemSize = formatOtherValue(order.itemSize, order.itemSizeOther);

      // Map threads array to thread1, 2, 3 for GAS backend compatibility
      const submissionData = {
        ...order,
        itemColor,
        itemSize,
        soundCardQty: order.soundCardQty || 0,
        ticketNumber: ticket,
        thread1: order.threads[0] || "",
        thread2: order.threads[1] || "",
        thread3: order.threads[2] || "",
        deliveryMethod: order.deliveryMethod === "shipping" ? "配送" : "当日渡し",
        shippingFee: order.shippingFee,
        shipZip: order.shipping.zip,
        shipAddress: order.shipping.address,
        shipBuilding: order.shipping.building,
        shipName: order.shipping.name,
        shipPhone: order.shipping.phone,
        shipEmail: order.shipping.email,
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

  const threadLimit = threadLimitFor(order.plan);
  const colorOk = isBringInItem(order.item)
    ? true
    : !!order.itemColor &&
      (order.itemColor !== OTHER_OPTION || !!order.itemColorOther.trim());
  const sizeOk =
    !!order.itemSize &&
    (order.itemSize !== OTHER_OPTION || !!order.itemSizeOther.trim());
  const gpsOk =
    order.option === "なし" ||
    (order.option === "GPS日時" &&
      isValidGpsText(order.gpsDatetime) &&
      isValidGpsText(order.gpsLocation));
  const isStep2Valid =
    order.plan &&
    order.option &&
    gpsOk &&
    order.item &&
    colorOk &&
    sizeOk &&
    order.threads.length === threadLimit &&
    order.threads.every(t => t !== "");

  const isStep3Valid =
    order.deliveryMethod === "pickup" ||
    (order.deliveryMethod === "shipping" && isShippingComplete(order.shipping));

  if (loading) {
    return (
      <div className="order-app order-loading">
        <BrandTitle />
        <span className="order-loading-text">読み込み中...</span>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="order-app success-screen">
        <div className="success-card">
          <div className="success-icon-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h1 className="success-title">Thank you</h1>

          {ticketNumber && (
            <div className="ticket-success-block">
              <span className="ticket-success-label">整理番号</span>
              <div className="ticket-success-number" aria-label={`整理番号 ${ticketNumber}`}>
                {ticketNumber}
              </div>
            </div>
          )}

          <p className="success-text">
            ご注文を承りました。<br />
            {ticketNumber ? <>整理番号は <strong>{ticketNumber}</strong> です。<br /></> : null}
            仕上がりまで、どうぞ楽しみにお待ちください。
          </p>

          <div className="success-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.location.href = "https://sts-process-visualization.jogimagi.com/"}
            >
              音の刺繍について
            </button>
            
            <button
              type="button"
              className="btn-home"
              onClick={() => window.location.reload()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              ホームへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-app">
      <div className={`container ${step === 4 ? "container-wide" : ""}`}>
        <header className={`order-header ${step === 1 ? "is-hero" : ""}`}>
          <BrandTitle compact={step !== 1} />
          <ol className="order-progress" aria-label={`ステップ ${step} / 4`}>
            {STEP_LABELS.map((label, i) => {
              const s = i + 1;
              return (
                <li
                  key={label}
                  className={`order-progress-step ${step === s ? "is-current" : step > s ? "is-done" : ""}`}
                >
                  <span className="order-progress-bar" />
                  <span className="order-progress-label">{label}</span>
                </li>
              );
            })}
          </ol>
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
            <Step3_Delivery
              order={order}
              masterData={masterData}
              onUpdate={updateOrder}
              onUpdateShipping={updateShipping}
            />
          )}

          {step === 4 && (
            <Step4_Preview
              order={order}
              staffConfirmed={isStaffConfirmed}
              ticketNumber={ticketNumber}
              masterThreads={masterData.threads}
            />
          )}
        </main>
      </div>

      {/* Refined Navigation Footer */}
      {step > 1 && !isSuccess && (
        <div className="nav-container">
          <div className="nav-inner">
            <button
              className="btn-nav btn-back"
              onClick={() => {
                if (step === 4) resetStaffFlow();
                prevStep();
              }}
              disabled={isSubmitting}
            >
              <span aria-hidden="true">←</span> 戻る
            </button>

            {step === 2 && (
              <button
                className="btn-nav btn-continue"
                disabled={!isStep2Valid}
                onClick={nextStep}
              >
                次へ <span aria-hidden="true">→</span>
              </button>
            )}

            {step === 3 && (
              <button
                className="btn-nav btn-continue"
                disabled={!isStep3Valid}
                onClick={nextStep}
              >
                次へ <span aria-hidden="true">→</span>
              </button>
            )}

            {step === 4 && (
              <button
                className="btn-nav btn-continue btn-staff"
                disabled={isSubmitting}
                onClick={() => {
                  setStaffModalStep(isStaffConfirmed ? (ticketNumber ? "review" : "pick") : "confirm");
                  setShowStaffConfirmation(true);
                }}
              >
                {isSubmitting ? "送信中..." : "スタッフ確認へ →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Staff Confirmation Modal: 確認 → 番号選択 → 大きく表示して送信 */}
      {showStaffConfirmation && !isSuccess && (
        <div className="modal-overlay">
          <div className={`modal-content ${staffModalStep === "confirm" ? "modal-content-alert" : ""}`}>
            {staffModalStep === "confirm" && (
              <>
                <div className="modal-alert-banner">まだ確定されていません</div>

                <div className="modal-icon-container modal-icon-alert">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>

                <h3 className="modal-title">スタッフ確認が必要です</h3>
                <div className="modal-text modal-text-alert">
                  この時点では注文は送信されていません。<br />
                  端末をスタッフに渡し、<br />
                  スタッフが操作を続けてください。
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-modal btn-modal-primary"
                    onClick={() => {
                      setIsStaffConfirmed(true);
                      setTicketNumber(null);
                      setStaffModalStep("pick");
                    }}
                  >
                    スタッフ確認済み
                  </button>

                  <button
                    className="btn-modal btn-modal-secondary"
                    onClick={resetStaffFlow}
                    disabled={isSubmitting}
                  >
                    もどる
                  </button>
                </div>
              </>
            )}

            {staffModalStep === "pick" && (
              <>
                <h3 className="modal-title">整理番号を選ぶ</h3>
                <p className="modal-text modal-text-plain">
                  1〜6の番号を押してください。<br />
                  次の画面で確認してから送信します。
                </p>
                <div className="ticket-pad" role="group" aria-label="整理番号">
                  {TICKET_NUMBERS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="ticket-pad-btn"
                      onClick={() => {
                        setTicketNumber(n);
                        setStaffModalStep("review");
                      }}
                      disabled={isSubmitting}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="modal-actions" style={{ marginTop: 20 }}>
                  <button
                    className="btn-modal btn-modal-secondary"
                    onClick={() => {
                      setTicketNumber(null);
                      setStaffModalStep("confirm");
                    }}
                    disabled={isSubmitting}
                  >
                    もどる
                  </button>
                </div>
              </>
            )}

            {staffModalStep === "review" && ticketNumber !== null && (
              <>
                <h3 className="modal-title">この番号で送信しますか？</h3>
                <div className="ticket-review-number" aria-live="polite">
                  {ticketNumber}
                </div>
                <p className="modal-text modal-text-plain">
                  整理番号 <strong>{ticketNumber}</strong>
                </p>
                <div className="modal-actions">
                  <button
                    className="btn-modal btn-modal-primary"
                    onClick={() => handleSubmit(ticketNumber)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "送信中..." : "この番号で送信"}
                  </button>
                  <button
                    className="btn-modal btn-modal-secondary"
                    onClick={() => {
                      setTicketNumber(null);
                      setStaffModalStep("pick");
                    }}
                    disabled={isSubmitting}
                  >
                    番号を選び直す
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
