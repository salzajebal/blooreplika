import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PRODUCTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";

export default function ProductList() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      
      <main className="container-custom py-12">
        {/* Category Title Banner */}
        <div className="bg-gray-50 p-8 mb-12 text-center border-b border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">전체 상품 목록</h1>
          <p className="text-gray-500">한국공인금거래소가 보증하는 최고의 품질</p>
        </div>
        
        {/* Filter Bar (Simplified) */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
          <div className="text-sm text-gray-500">
            총 <span className="font-bold text-primary">{PRODUCTS.length}</span>개의 상품이 있습니다.
          </div>
          <div className="flex gap-2 text-sm">
            <select className="border border-gray-200 rounded-none px-3 py-1.5 focus:outline-none focus:border-primary">
              <option>신상품순</option>
              <option>낮은가격순</option>
              <option>높은가격순</option>
              <option>인기상품순</option>
            </select>
          </div>
        </div>

        {/* Product Grid - Reusing structure but full page */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="group bg-white border border-gray-100 hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative flex flex-col">
              {/* Image Container */}
              <div className="aspect-square bg-gray-50 p-8 relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isBest && (
                    <span className="bg-gray-900 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider inline-block text-center">
                      Best
                    </span>
                  )}
                  {product.isNew && (
                    <span className="bg-red-600 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider inline-block text-center">
                      New
                    </span>
                  )}
                </div>
                
                {/* Hover Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 justify-center bg-white/90 backdrop-blur-sm border-t border-gray-100">
                  <Button size="icon" variant="outline" className="h-9 w-9 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-9 w-9 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors">
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-4 text-center flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{product.purity} / {product.weight}</div>
                  <h3 className="font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors line-clamp-2 h-10 flex items-center justify-center text-sm">
                    {product.name}
                  </h3>
                </div>
                
                <div className="pt-3 border-t border-dashed border-gray-100 w-full">
                  <div className="flex justify-center items-baseline gap-1">
                    <span className="text-lg font-bold text-primary">{product.price}</span>
                    <span className="text-xs text-gray-500">원</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
