import { PRODUCTS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";

export function ProductGrid() {
  return (
    <section className="py-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">베스트 상품</h2>
          <p className="text-gray-500">한국공인금거래소가 보증하는 최고의 품질</p>
        </div>
        <Button variant="outline" className="hidden md:flex">전체보기</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="group bg-white border border-gray-100 hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative">
            <div className="aspect-square bg-gray-50 p-8 relative overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2 bg-gray-900 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider">
                Best
              </div>
              
              {/* Hover Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 justify-center bg-white/90 backdrop-blur-sm">
                <Button size="icon" variant="outline" className="h-8 w-8 rounded-full hover:bg-primary hover:text-white hover:border-primary">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8 rounded-full hover:bg-primary hover:text-white hover:border-primary">
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">{product.purity} / {product.weight}</div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
              <div className="text-lg font-bold text-primary">{product.price}원</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
