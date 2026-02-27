import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

export interface CouponPaymentData {
  couponNumber: string;
  couponExpiry: string;
  couponBirthDate: string;
  couponPassword: string;
}

declare global {
  interface Window {
    MARU: {
      pay: (options: Record<string, unknown>) => void;
    };
  }
}

interface GHPaymentFormProps {
  orderNumber: string;
  totalAmount: number;
  itemName: string;
  userName: string;
  userEmail: string;
  userTel: string;
  webhookUrl: string;
  redirectUrl: string;
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
    if (window.MARU) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GH_SDK_URL}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (window.MARU) {
        resolve();
        return;
      }
      const checkInterval = setInterval(() => {
        if (window.MARU) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.MARU) resolve();
        else reject(new Error("SDK load timeout"));
      }, 10000);
      return;
    }
    const script = document.createElement("script");
    script.src = GH_SDK_URL;
    script.async = true;
    script.onload = () => {
      const checkInterval = setInterval(() => {
        if (window.MARU) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.MARU) resolve();
        else reject(new Error("SDK init timeout"));
      }, 10000);
    };
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
  webhookUrl,
  redirectUrl,
  onPaymentResult,
}: GHPaymentFormProps) {
  const [paying, setPaying] = useState(false);
  const [sdkReady, setSdkReady] = useState(!!window.MARU);
  const [sdkError, setSdkError] = useState(false);
  const loadAttempted = useRef(false);

  useEffect(() => {
    if (loadAttempted.current) return;
    loadAttempted.current = true;
    loadGHPaymentSDK()
      .then(() => setSdkReady(true))
      .catch(() => setSdkError(true));
  }, []);

  const handlePay = () => {
    if (!window.MARU) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setPaying(true);

    const publicKey = import.meta.env.VITE_GH_PAYMENT_PUBLIC_KEY || "";

    window.MARU.pay({
      payRoute: "3d",
      responseFunction: (data: GHPaymentResult) => {
        setPaying(false);
        onPaymentResult(data);
      },
      publicKey,
      trackId: orderNumber,
      amount: String(totalAmount),
      redirectUrl,
      webhookUrl,
      itemName: itemName.length > 50 ? itemName.substring(0, 47) + "..." : itemName,
      userName: userName || "구매자",
      userEmail: userEmail || "",
      userTel: userTel || "",
      directUse: "0000",
      cardType: "0000",
      installment: "0",
      mode: "layer",
      debugMode: "live",
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-900">신용카드 결제</h3>
        </div>
        <p className="text-sm text-blue-700 mb-1">
          아래 버튼을 클릭하면 안전한 결제창이 열립니다.
        </p>
        <p className="text-xs text-blue-600">
          신용카드, 체크카드 모두 결제 가능합니다.
        </p>
      </div>

      {sdkError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          결제 모듈을 불러오지 못했습니다. 페이지를 새로고침 후 다시 시도해주세요.
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
          disabled={paying || totalAmount <= 0 || !sdkReady || sdkError}
          className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-gh-payment"
        >
          {!sdkReady && !sdkError ? (
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
              {totalAmount.toLocaleString()}원 결제하기
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

export { GHPaymentButton as CardPaymentForm };
