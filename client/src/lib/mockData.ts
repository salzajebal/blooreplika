import goldBar1kg from "@assets/generated_images/1kg_gold_bar_product_shot.png";
import goldBar100g from "@assets/generated_images/100g_gold_bar_product_shot.png";
import silverBar1kg from "@assets/generated_images/1kg_silver_bar_product_shot.png";
import babyRing from "@assets/generated_images/gold_baby_ring_(dol_ring)_product_shot.png";
import goldBar10gLS from "@assets/generated_images/10g_gold_bar_ls-nikko_product_shot.png";
import goldBar375g from "@assets/generated_images/37.5g_gold_bar_product_shot.png";
import silverBar100g from "@assets/generated_images/100g_silver_bar_product_shot.png";
import goldTurtle from "@assets/generated_images/gold_turtle_gift_product_shot.png";
import goldKey from "@assets/generated_images/gold_key_gift_product_shot.png";
import goldPig from "@assets/generated_images/gold_pig_gift_product_shot.png";

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

export const CATEGORIES = [
  { id: "gold_bar", name: "골드바", count: 42 },
  { id: "silver_bar", name: "실버바", count: 15 },
  { id: "baby_ring", name: "돌반지/돌팔찌", count: 28 },
  { id: "gift_gold", name: "순금기념품", count: 35 },
  { id: "jewelry", name: "순금주얼리", count: 56 },
  { id: "silver_coin", name: "은화/기타", count: 12 },
];

// Expanded product list to match a real catalog
export const PRODUCTS = [
  // Gold Bars
  {
    id: 1,
    name: "한국공인금거래소 골드바 1,000g",
    weight: "1000g",
    purity: "999.9‰",
    price: "149,800,000",
    image: goldBar1kg,
    category: "gold_bar",
    isBest: true,
    isNew: false,
  },
  {
    id: 2,
    name: "한국공인금거래소 골드바 100g",
    weight: "100g",
    purity: "999.9‰",
    price: "15,100,000",
    image: goldBar100g,
    category: "gold_bar",
    isBest: true,
    isNew: false,
  },
  {
    id: 5,
    name: "한국공인금거래소 골드바 10g",
    weight: "10g",
    purity: "999.9‰",
    price: "1,550,000",
    image: goldBar10gLS,
    category: "gold_bar",
    isBest: false,
    isNew: true,
  },
  {
    id: 6,
    name: "한국공인금거래소 골드바 37.5g",
    weight: "37.5g",
    purity: "999.9‰",
    price: "5,620,000",
    image: goldBar375g,
    category: "gold_bar",
    isBest: true,
    isNew: false,
  },
  {
    id: 7,
    name: "LS-Nikko 동제련 골드바 100g",
    weight: "100g",
    purity: "999.9‰",
    price: "15,250,000",
    image: goldBar100g,
    category: "gold_bar",
    isBest: false,
    isNew: false,
  },
  {
    id: 8,
    name: "LS-Nikko 동제련 골드바 1000g",
    weight: "1000g",
    purity: "999.9‰",
    price: "150,500,000",
    image: goldBar1kg,
    category: "gold_bar",
    isBest: false,
    isNew: false,
  },
  
  // Silver Bars
  {
    id: 3,
    name: "한국공인금거래소 실버바 1,000g",
    weight: "1000g",
    purity: "999.9‰",
    price: "1,850,000",
    image: silverBar1kg,
    category: "silver_bar",
    isBest: true,
    isNew: false,
  },
  {
    id: 9,
    name: "한국공인금거래소 실버바 100g",
    weight: "100g",
    purity: "999.9‰",
    price: "195,000",
    image: silverBar100g,
    category: "silver_bar",
    isBest: false,
    isNew: true,
  },
  
  // Baby Rings (Dol Gifts)
  {
    id: 4,
    name: "순금 뽀르띠 돌반지 1.875g",
    weight: "1.875g",
    purity: "99.9%",
    price: "285,000",
    image: babyRing,
    category: "baby_ring",
    isBest: true,
    isNew: false,
  },
  {
    id: 10,
    name: "순금 왕관 돌반지 3.75g",
    weight: "3.75g",
    purity: "99.9%",
    price: "540,000",
    image: babyRing,
    category: "baby_ring",
    isBest: false,
    isNew: true,
  },
  {
    id: 11,
    name: "순금 천사 날개 돌반지 3.75g",
    weight: "3.75g",
    purity: "99.9%",
    price: "545,000",
    image: babyRing,
    category: "baby_ring",
    isBest: false,
    isNew: false,
  },
  
  // Gift Gold (Commemorative)
  {
    id: 12,
    name: "순금 행운의 열쇠 3.75g",
    weight: "3.75g",
    purity: "99.9%",
    price: "550,000",
    image: goldKey,
    category: "gift_gold",
    isBest: true,
    isNew: false,
  },
  {
    id: 13,
    name: "순금 황금돼지 37.5g",
    weight: "37.5g",
    purity: "99.9%",
    price: "5,700,000",
    image: goldPig,
    category: "gift_gold",
    isBest: false,
    isNew: true,
  },
  {
    id: 14,
    name: "순금 거북이 18.75g",
    weight: "18.75g",
    purity: "99.9%",
    price: "2,850,000",
    image: goldTurtle,
    category: "gift_gold",
    isBest: false,
    isNew: false,
  }
];

export const NOTICE_DATA = [
  { id: 1, title: "[공지] 2025년 추석 연휴 배송 안내", date: "2025-09-15" },
  { id: 2, title: "시스템 점검 안내 (10/01 00:00 ~ 04:00)", date: "2025-09-28" },
  { id: 3, title: "골드바 패키지 리뉴얼 안내", date: "2025-08-20" },
  { id: 4, title: "안심 택배 서비스 도입", date: "2025-08-15" },
  { id: 5, title: "보이스피싱 관련 주의사항 안내", date: "2025-07-10" },
];
