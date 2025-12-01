import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PriceBoard } from "@/components/home/PriceBoard";

export default function GoldPrice() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      
      <main className="container-custom py-12">
        <div className="bg-gray-50 p-8 mb-12 text-center border-b border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">금시세조회</h1>
          <p className="text-gray-500">실시간 국제 시세를 반영한 투명한 가격 정보</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
           <PriceBoard />
           
           <div className="mt-12 prose max-w-none">
             <h3 className="font-bold text-lg border-b border-gray-200 pb-2 mb-4">시세 관련 안내</h3>
             <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
               <li>상기 시세는 부가세(VAT) 별도 가격입니다.</li>
               <li>국제 금 시세 변동에 따라 실시간으로 변경될 수 있습니다.</li>
               <li>매입 시세는 제품의 상태(정제금, 스크랩 등)에 따라 차감될 수 있습니다.</li>
               <li>대량 거래 시 별도 문의 바랍니다.</li>
             </ul>
           </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
