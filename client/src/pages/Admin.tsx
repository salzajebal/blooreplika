import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@shared/schema";

const CATEGORY_OPTIONS = [
  { id: "gold_bar", name: "골드바" },
  { id: "silver_bar", name: "실버바" },
  { id: "baby_ring", name: "돌반지/돌팔찌" },
  { id: "jewelry", name: "순금제품" },
  { id: "diamond", name: "다이아몬드" },
  { id: "corporate", name: "기업선물" },
  { id: "gift_gold", name: "순금기념품" },
  { id: "event", name: "이벤트" },
];

export default function Admin() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    weight: "",
    purity: "",
    price: "",
    category: "gold_bar",
    isBest: false,
    isNew: false,
    description: "",
    imageUrl: "",
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Seed data
  const handleSeedData = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "초기 데이터가 생성되었습니다." });
        fetchProducts();
        fetchCategories();
      }
    } catch (error) {
      toast({ title: "오류", description: "데이터 생성에 실패했습니다.", variant: "destructive" });
    }
  };

  // Create product
  const handleCreate = async () => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 추가되었습니다." });
        setShowAddForm(false);
        setFormData({ name: "", weight: "", purity: "", price: "", category: "gold_bar", isBest: false, isNew: false, description: "", imageUrl: "" });
        fetchProducts();
      } else {
        toast({ title: "오류", description: "상품 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  // Update product
  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 수정되었습니다." });
        setEditingId(null);
        fetchProducts();
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 삭제되었습니다." });
        fetchProducts();
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  // Start editing
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      weight: product.weight,
      purity: product.purity,
      price: product.price,
      category: product.category,
      isBest: product.isBest || false,
      isNew: product.isNew || false,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      
      <main className="container-custom py-12">
        <div className="bg-white p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">상품 관리</h1>
              <p className="text-gray-500">관리자 페이지 - 상품 등록/수정/삭제</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSeedData} className="gap-2">
                <Database className="w-4 h-4" />
                초기 데이터 생성
              </Button>
              <Button variant="outline" onClick={fetchProducts} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                새로고침
              </Button>
              <Button onClick={() => setShowAddForm(true)} className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                상품 추가
              </Button>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
              <h3 className="font-bold text-lg mb-4">새 상품 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input
                  placeholder="상품명"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  placeholder="무게 (예: 100g)"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
                <Input
                  placeholder="순도 (예: 999.9‰)"
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                />
                <Input
                  placeholder="가격 (예: 15,100,000)"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
                <select
                  className="border border-gray-200 rounded-md px-3 py-2"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <Input
                  placeholder="이미지 URL (선택)"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBest}
                    onChange={(e) => setFormData({ ...formData, isBest: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Best 상품</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">New 상품</span>
                </label>
              </div>
              <Textarea
                placeholder="상품 설명 (선택)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mb-4"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">저장</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>취소</Button>
              </div>
            </div>
          )}

          {/* Product List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">로딩 중...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500 mb-4">등록된 상품이 없습니다.</p>
              <Button onClick={handleSeedData} variant="outline">초기 데이터 생성하기</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">상품명</th>
                    <th className="px-4 py-3 text-left font-medium">무게</th>
                    <th className="px-4 py-3 text-left font-medium">순도</th>
                    <th className="px-4 py-3 text-left font-medium">가격</th>
                    <th className="px-4 py-3 text-left font-medium">카테고리</th>
                    <th className="px-4 py-3 text-center font-medium">상태</th>
                    <th className="px-4 py-3 text-right font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {editingId === product.id ? (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              className="h-8 w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={formData.purity}
                              onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                              className="h-8 w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              className="h-8 w-32"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                              {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <label className="inline-flex items-center gap-1 mr-2">
                              <input
                                type="checkbox"
                                checked={formData.isBest}
                                onChange={(e) => setFormData({ ...formData, isBest: e.target.checked })}
                              />
                              <span className="text-xs">Best</span>
                            </label>
                            <label className="inline-flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={formData.isNew}
                                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                              />
                              <span className="text-xs">New</span>
                            </label>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon" variant="ghost" onClick={() => handleUpdate(product.id)} className="h-8 w-8 text-green-600">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-gray-500">
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                          <td className="px-4 py-3 text-gray-600">{product.weight}</td>
                          <td className="px-4 py-3 text-gray-600">{product.purity}</td>
                          <td className="px-4 py-3 text-primary font-bold">{product.price}원</td>
                          <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              {CATEGORY_OPTIONS.find(c => c.id === product.category)?.name || product.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {product.isBest && <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-[10px] mr-1">Best</span>}
                            {product.isNew && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px]">New</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(product)} className="h-8 w-8">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)} className="h-8 w-8 text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
