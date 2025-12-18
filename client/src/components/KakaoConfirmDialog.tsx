import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface KakaoConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function KakaoConfirmDialog({ open, onConfirm, onCancel }: KakaoConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <DialogTitle className="text-lg font-bold">카카오톡 상담 안내</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p className="text-gray-700 font-medium">
              카카오톡 상담은 <span className="text-amber-600 font-bold">결제 및 재고 안내</span>를 위한 상담입니다.
            </p>
            <p className="text-gray-600">
              구입 전 충분한 고민 후 상담을 부탁드립니다.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
              <p className="text-amber-800 text-sm">
                상담 시간: 평일 09:00 ~ 18:00
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            취소
          </Button>
          <Button 
            onClick={onConfirm}
            className="flex-1 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E]"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
