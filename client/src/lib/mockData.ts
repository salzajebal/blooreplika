import goldBar1kg from "@assets/generated_images/1kg_gold_bar_product_shot.png";
import goldBar100g from "@assets/generated_images/100g_gold_bar_product_shot.png";
import silverBar1kg from "@assets/generated_images/1kg_silver_bar_product_shot.png";
import babyRing from "@assets/generated_images/gold_baby_ring_(dol_ring)_product_shot.png";

export const PRICE_DATA = {
  gold: {
    buy: "562,000",
    sell: "508,000",
    trend: "up",
    change: "3,000",
  },
  silver: {
    buy: "6,820",
    sell: "5,560",
    trend: "down",
    change: "80",
  },
  platinum: {
    buy: "198,000",
    sell: "165,000",
    trend: "steady",
    change: "0",
  },
};

export const PRODUCTS = [
  {
    id: 1,
    name: "골드바 1kg",
    weight: "1000g",
    purity: "99.99%",
    price: "149,800,000",
    image: goldBar1kg,
    category: "gold",
  },
  {
    id: 2,
    name: "골드바 100g",
    weight: "100g",
    purity: "99.99%",
    price: "15,100,000",
    image: goldBar100g,
    category: "gold",
  },
  {
    id: 3,
    name: "실버바 1kg",
    weight: "1000g",
    purity: "99.99%",
    price: "1,850,000",
    image: silverBar1kg,
    category: "silver",
  },
  {
    id: 4,
    name: "돌반지 (반돈)",
    weight: "1.875g",
    purity: "99.9%",
    price: "285,000",
    image: babyRing,
    category: "ring",
  },
  {
    id: 5,
    name: "골드바 10g",
    weight: "10g",
    purity: "99.99%",
    price: "1,550,000",
    image: goldBar100g,
    category: "gold",
  },
  {
    id: 6,
    name: "골드바 37.5g (10돈)",
    weight: "37.5g",
    purity: "99.99%",
    price: "5,620,000",
    image: goldBar100g,
    category: "gold",
  },
];

export const NOTICE_DATA = [
  { id: 1, title: "[공지] 2025년 추석 연휴 배송 안내", date: "2025-09-15" },
  { id: 2, title: "시스템 점검 안내 (10/01 00:00 ~ 04:00)", date: "2025-09-28" },
  { id: 3, title: "골드바 패키지 리뉴얼 안내", date: "2025-08-20" },
  { id: 4, title: "안심 택배 서비스 도입", date: "2025-08-15" },
];
