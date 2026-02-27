import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, AlertCircle, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    MARU: any;
    maruPaymentResult: (data: any) => void;
  }
}

interface GHPaymentFormProps {
  orderNumber: string;
  totalAmount: number;
  itemName: string;
  userName: string;
  userEmail: string;
  userTel: string;
  onPaymentResult: (data: GHPaymentResult) => void;
}

export interface GHPaymentResult {
  resultCode: string;
  resultMsg: string;
  trackId: string;
  amount: string;
  cardNo?: string;
  authNo?: string;
  tranDate?: string;
  [key: string]: unknown;
}

const GH_SDK_URL = "https://api.ghpayments.kr/js/clientsideV2.js";

function loadGHPaymentSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MARU && typeof window.MARU.pay === "function") {
      resolve();
      return;
    }

    const waitForMARU = (timeoutMs: number) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (window.MARU && typeof window.MARU.pay === "function") {
          clearInterval(check);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(check);
          reject(new Error("SDK init timeout"));
        }
      }, 300);
    };

    const existing = document.querySelector(`script[src="${GH_SDK_URL}"]`) as HTMLScriptElement | null;
    if (existing) {
      waitForMARU(15000);
      return;
    }

    const script = document.createElement("script");
    script.src = GH_SDK_URL;
    script.async = true;
    script.onload = () => waitForMARU(15000);
    script.onerror = () => reject(new Error("SDK load failed"));
    document.head.appendChild(script);
  });
}

export function GHPaymentButton({
  orderNumber,
  totalAmount,
  itemName,
  userName,
  userEmail,
  userTel,
  onPaymentResult,
}: GHPaymentFormProps) {
  const [paying, setPaying] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [loadingSDK, setLoadingSDK] = useState(true);
  const [showPopupGuide, setShowPopupGuide] = useState(false);
  const loadAttempted = useRef(false);
  const paymentResultReceived = useRef(false);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initSDK = useCallback(() => {
    setLoadingSDK(true);
    setSdkError(null);
    setSdkReady(false);

    loadGHPaymentSDK()
      .then(() => {
        setSdkReady(true);
        setLoadingSDK(false);
        console.log("[GH Payment] SDK loaded successfully");
      })
      .catch((err) => {
        console.error("[GH Payment] SDK load error:", err);
        setSdkError("결제 모듈을 불러오지 못했습니다. 페이지를 새로고침 후 다시 시도해주세요.");
        setLoadingSDK(false);
      });
  }, []);

  useEffect(() => {
    if (loadAttempted.current) return;
    loadAttempted.current = true;
    initSDK();
  }, [initSDK]);

  useEffect(() => {
    return () => {
      delete (window as any).maruPaymentResult;
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, []);

  const handlePay = () => {
    if (!window.MARU || typeof window.MARU.pay !== "function") {
      setSdkError("결제 모듈이 준비되지 않았습니다. 페이지를 새로고침해주세요.");
      return;
    }

    const publicKey = import.meta.env.VITE_GH_PAYMENT_PUBLIC_KEY || "";
    if (!publicKey) {
      setSdkError("결제 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.");
      return;
    }

    setShowPopupGuide(false);
    setPaying(true);
    setSdkError(null);
    paymentResultReceived.current = false;

    window.maruPaymentResult = function(data: any) {
      console.log("[GH Payment] Response received:", data);
      paymentResultReceived.current = true;
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
        popupTimerRef.current = null;
      }
      setPaying(false);
      onPaymentResult(data as GHPaymentResult);
    };

    const paymentParams: Record<string, any> = {
      payRoute: "3d",
      publicKey,
      trackId: orderNumber,
      amount: String(totalAmount),
      redirectUrl: `${window.location.origin}/order-complete/${orderNumber}`,
      webhookUrl: `${window.location.origin}/api/payments/webhook`,
      itemName: itemName.length > 50 ? itemName.substring(0, 47) + "..." : itemName,
      userName: userName || "구매자",
      userEmail: userEmail || "",
      userTel: userTel || "",
      directUse: "0000",
      cardType: "0000",
      installment: "0",
      mode: "popup",
      debugMode: "live",
      responseFunction: "maruPaymentResult",
    };

    console.log("[GH Payment] Calling MARU.pay");

    try {
      window.MARU.pay(paymentParams);

      popupTimerRef.current = setTimeout(() => {
        if (!paymentResultReceived.current) {
          console.log("[GH Payment] No response after 3s, showing popup guide");
          setPaying(false);
          setShowPopupGuide(true);
        }
      }, 3000);
    } catch (err: any) {
      console.error("[GH Payment] MARU.pay error:", err);
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
        popupTimerRef.current = null;
      }
      setPaying(false);
      setShowPopupGuide(true);
      setSdkError(`결제창 호출 중 오류가 발생했습니다. 팝업 차단을 해제하고 다시 시도해주세요.`);
    }
  };

  return (
    <div className="space-y-4" data-testid="card-payment-section">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-900">신용카드 결제</h3>
        </div>
        <p className="text-sm text-blue-700">
          아래 버튼을 클릭하면 결제창이 팝업으로 열립니다.
        </p>
        <p className="text-xs text-blue-500 mt-1">
          결제창이 열리지 않으면 브라우저의 팝업 차단을 해제해주세요.
        </p>
      </div>

      {showPopupGuide && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4" data-testid="popup-block-guide">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-amber-900 text-sm mb-2">결제창이 열리지 않나요?</h4>
              <p className="text-sm text-amber-800 mb-3">
                브라우저에서 팝업이 차단되었을 수 있습니다. 아래 방법으로 팝업 차단을 해제한 후 다시 시도해주세요.
              </p>
              <div className="space-y-2 text-xs text-amber-700">
                <div className="bg-white rounded-md p-2.5 border border-amber-200">
                  <p className="font-semibold text-amber-900 mb-1">Chrome (크롬)</p>
                  <p>주소창 오른쪽 끝에 팝업 차단 아이콘이 나타나면 클릭 → "이 사이트의 팝업 항상 허용" 선택</p>
                </div>
                <div className="bg-white rounded-md p-2.5 border border-amber-200">
                  <p className="font-semibold text-amber-900 mb-1">Safari (사파리)</p>
                  <p>Safari → 설정 → 웹사이트 → 팝업 창 → 이 사이트를 "허용"으로 변경</p>
                </div>
                <div className="bg-white rounded-md p-2.5 border border-amber-200">
                  <p className="font-semibold text-amber-900 mb-1">모바일 Chrome</p>
                  <p>⋮ 메뉴 → 설정 → 사이트 설정 → 팝업 및 리디렉션 → 허용</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                onClick={() => {
                  setShowPopupGuide(false);
                  handlePay();
                }}
                data-testid="button-retry-after-popup"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                팝업 해제 후 다시 결제하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {sdkError && !showPopupGuide && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{sdkError}</p>
            <button
              type="button"
              onClick={() => {
                loadAttempted.current = false;
                initSDK();
              }}
              className="text-xs text-red-600 underline mt-1 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              다시 시도
            </button>
          </div>
        </div>
      )}

      <div className="pt-2 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">결제 금액</span>
          <span className="text-2xl font-bold text-red-500">
            {totalAmount.toLocaleString()}원
          </span>
        </div>

        <Button
          type="button"
          onClick={handlePay}
          disabled={paying || totalAmount <= 0 || !sdkReady || loadingSDK}
          className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-gh-payment"
        >
          {loadingSDK ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              결제 모듈 로딩 중...
            </span>
          ) : paying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              결제 진행 중...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {totalAmount.toLocaleString()}원 카드결제
            </span>
          )}
        </Button>
      </div>

      <div id="GHPayment" style={{ display: "none" }} />
    </div>
  );
}
