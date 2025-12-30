import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CouponPaymentData {
  couponNumber: string;
  couponExpiry: string;
  couponBirthDate: string;
  couponPassword: string;
}

interface CardPaymentFormProps {
  onSubmit: (isValid: boolean, data?: CouponPaymentData) => void;
  totalAmount: number;
  onChange?: (data: CouponPaymentData, isValid: boolean) => void;
}

interface FormErrors {
  cardNumber?: string;
  expiryDate?: string;
  birthDate?: string;
  password?: string;
}

export function CardPaymentForm({ onSubmit, totalAmount, onChange }: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    validateField("cardNumber", formatted.replace(/\s/g, ""));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setExpiryDate(value);
    validateField("expiryDate", value);
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setBirthDate(value);
    validateField("birthDate", value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2);
    setPassword(value);
    validateField("password", value);
  };

  const validateField = useCallback((field: string, value: string) => {
    const newErrors: FormErrors = { ...errors };

    switch (field) {
      case "cardNumber":
        if (value.length === 0) {
          newErrors.cardNumber = "쿠폰번호를 입력해주세요";
        } else if (value.length !== 16) {
          newErrors.cardNumber = "쿠폰번호 16자리를 입력해주세요";
        } else {
          delete newErrors.cardNumber;
        }
        break;

      case "expiryDate":
        if (value.length === 0) {
          newErrors.expiryDate = "유효기간을 입력해주세요";
        } else if (value.length !== 4) {
          newErrors.expiryDate = "MMYY 형식으로 4자리 입력해주세요";
        } else {
          const month = parseInt(value.slice(0, 2), 10);
          if (month < 1 || month > 12) {
            newErrors.expiryDate = "월(MM)은 01~12 사이여야 합니다";
          } else {
            delete newErrors.expiryDate;
          }
        }
        break;

      case "birthDate":
        if (value.length === 0) {
          newErrors.birthDate = "생년월일을 입력해주세요";
        } else if (value.length !== 6) {
          newErrors.birthDate = "YYMMDD 형식으로 6자리 입력해주세요";
        } else {
          const month = parseInt(value.slice(2, 4), 10);
          const day = parseInt(value.slice(4, 6), 10);
          if (month < 1 || month > 12) {
            newErrors.birthDate = "월(MM)은 01~12 사이여야 합니다";
          } else if (day < 1 || day > 31) {
            newErrors.birthDate = "일(DD)은 01~31 사이여야 합니다";
          } else {
            delete newErrors.birthDate;
          }
        }
        break;

      case "password":
        if (value.length === 0) {
          newErrors.password = "비밀번호 앞 2자리를 입력해주세요";
        } else if (value.length !== 2) {
          newErrors.password = "비밀번호 앞 2자리를 입력해주세요";
        } else {
          delete newErrors.password;
        }
        break;
    }

    setErrors(newErrors);
  }, [errors]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFormValid = () => {
    const cardDigits = cardNumber.replace(/\s/g, "");
    return (
      cardDigits.length === 16 &&
      expiryDate.length === 4 &&
      parseInt(expiryDate.slice(0, 2), 10) >= 1 &&
      parseInt(expiryDate.slice(0, 2), 10) <= 12 &&
      birthDate.length === 6 &&
      password.length === 2 &&
      Object.keys(errors).length === 0
    );
  };

  const getCouponPaymentData = (): CouponPaymentData => ({
    couponNumber: cardNumber.replace(/\s/g, ""),
    couponExpiry: expiryDate,
    couponBirthDate: birthDate,
    couponPassword: password
  });

  useEffect(() => {
    if (onChange) {
      onChange(getCouponPaymentData(), isFormValid());
    }
  }, [cardNumber, expiryDate, birthDate, password, errors]);

  const handleSubmit = () => {
    setTouched({
      cardNumber: true,
      expiryDate: true,
      birthDate: true,
      password: true,
    });

    validateField("cardNumber", cardNumber.replace(/\s/g, ""));
    validateField("expiryDate", expiryDate);
    validateField("birthDate", birthDate);
    validateField("password", password);

    if (isFormValid()) {
      onSubmit(true, getCouponPaymentData());
    }
  };

  const formatExpiryDisplay = (value: string) => {
    if (value.length >= 2) {
      return value.slice(0, 2) + "/" + value.slice(2);
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-bold">쿠폰결제</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="cardNumber" className="text-sm font-medium">
            쿠폰번호
          </Label>
          <Input
            id="cardNumber"
            type="text"
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={handleCardNumberChange}
            onBlur={() => handleBlur("cardNumber")}
            className={cn(
              "mt-1 font-mono text-lg tracking-wider",
              touched.cardNumber && errors.cardNumber && "border-red-500 focus-visible:ring-red-500"
            )}
            data-testid="input-coupon-number"
          />
          {touched.cardNumber && errors.cardNumber && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.cardNumber}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expiryDate" className="text-sm font-medium">
              유효기간 (MM/YY)
            </Label>
            <Input
              id="expiryDate"
              type="text"
              inputMode="numeric"
              placeholder="MMYY"
              value={expiryDate}
              onChange={handleExpiryChange}
              onBlur={() => handleBlur("expiryDate")}
              className={cn(
                "mt-1 font-mono",
                touched.expiryDate && errors.expiryDate && "border-red-500 focus-visible:ring-red-500"
              )}
              data-testid="input-coupon-expiry"
            />
            {expiryDate.length === 4 && !errors.expiryDate && (
              <p className="mt-1 text-sm text-gray-500">
                {formatExpiryDisplay(expiryDate)}
              </p>
            )}
            {touched.expiryDate && errors.expiryDate && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.expiryDate}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="birthDate" className="text-sm font-medium">
              생년월일 (YYMMDD)
            </Label>
            <Input
              id="birthDate"
              type="text"
              inputMode="numeric"
              placeholder="YYMMDD"
              value={birthDate}
              onChange={handleBirthDateChange}
              onBlur={() => handleBlur("birthDate")}
              className={cn(
                "mt-1 font-mono",
                touched.birthDate && errors.birthDate && "border-red-500 focus-visible:ring-red-500"
              )}
              data-testid="input-coupon-birthdate"
            />
            {touched.birthDate && errors.birthDate && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.birthDate}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium">
            비밀번호 앞 2자리
          </Label>
          <Input
            id="password"
            type="password"
            inputMode="numeric"
            placeholder="●●"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur("password")}
            maxLength={2}
            className={cn(
              "mt-1 w-24 font-mono text-center text-lg tracking-widest",
              touched.password && errors.password && "border-red-500 focus-visible:ring-red-500"
            )}
            data-testid="input-coupon-password"
          />
          {touched.password && errors.password && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.password}
            </p>
          )}
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">결제 금액</span>
          <span className="text-2xl font-bold text-primary">
            {totalAmount.toLocaleString()}원
          </span>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className={cn(
            "w-full h-12 text-lg font-bold transition-all",
            isFormValid() 
              ? "bg-primary hover:bg-primary/90" 
              : "bg-gray-300 cursor-not-allowed"
          )}
          data-testid="button-submit-coupon-payment"
        >
          {isFormValid() ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              결제 진행
            </span>
          ) : (
            "정보를 입력해주세요"
          )}
        </Button>

        <p className="mt-3 text-xs text-gray-400 text-center">
          * 입력된 쿠폰 정보는 결제 처리 후 관리자가 확인합니다
        </p>
      </div>
    </div>
  );
}
