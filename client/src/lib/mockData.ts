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
import diamondRing from "@assets/generated_images/diamond_ring_solitaire_product_shot.png";
import diamondNecklace from "@assets/generated_images/diamond_necklace_product_shot.png";
import pureGoldNecklace from "@assets/generated_images/pure_gold_necklace_product_shot.png";
import pureGoldBracelet from "@assets/generated_images/pure_gold_bracelet_product_shot.png";
import corporatePlaque from "@assets/generated_images/gold_corporate_plaque_product_shot.png";
import eventCoin from "@assets/generated_images/event_gold_coin_product_shot.png";

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
  { id: "gold_bar", name: "골드바", count: 42, description: "한국골드금거래소가 보증하는 최고 품질의 순금 바" },
  { id: "silver_bar", name: "실버바", count: 15, description: "투자 가치가 높은 고순도 실버바 컬렉션" },
  { id: "baby_ring", name: "돌반지/돌팔찌", count: 28, description: "소중한 아이의 첫 생일을 축하하는 순금 선물" },
  { id: "jewelry", name: "순금제품", count: 56, description: "품격 있는 디자인의 고순도 순금 주얼리" },
  { id: "diamond", name: "다이아몬드", count: 12, description: "영원히 변치 않는 가치, 최상급 다이아몬드" },
  { id: "corporate", name: "기업선물", count: 24, description: "임직원 및 VIP를 위한 품격 있는 기업 전용 선물" },
  { id: "gift_gold", name: "순금기념품", count: 35, description: "특별한 날을 기념하는 소장가치 높은 순금 기념품" },
  { id: "event", name: "이벤트", count: 8, description: "한국골드금거래소의 특별한 혜택과 기획 상품" },
];

// Expanded product list to match a real catalog
export const PRODUCTS = [
  // Gold Bars
  {
    id: 1,
    name: "한국골드금거래소 골드바 1,000g",
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
    name: "한국골드금거래소 골드바 100g",
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
    name: "한국골드금거래소 골드바 10g",
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
    name: "한국골드금거래소 골드바 37.5g",
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
    name: "한국골드금거래소 실버바 1,000g",
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
    name: "한국골드금거래소 실버바 100g",
    weight: "100g",
    purity: "999.9‰",
    price: "195,000",
    image: silverBar100g,
    category: "silver_bar",
    isBest: false,
    isNew: true,
  },
  
  // Baby Rings (Dol Gifts) & Jewelry (Pure Gold Products)
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
    id: 15,
    name: "순금 체인 목걸이 18.75g",
    weight: "18.75g",
    purity: "99.9%",
    price: "2,750,000",
    image: pureGoldNecklace,
    category: "jewelry",
    isBest: true,
    isNew: false,
  },
  {
    id: 16,
    name: "순금 팔찌 37.5g (10돈)",
    weight: "37.5g",
    purity: "99.9%",
    price: "5,450,000",
    image: pureGoldBracelet,
    category: "jewelry",
    isBest: false,
    isNew: true,
  },
  {
    id: 17,
    name: "순금 대나무 체인 목걸이 37.5g",
    weight: "37.5g",
    purity: "99.9%",
    price: "5,520,000",
    image: pureGoldNecklace,
    category: "jewelry",
    isBest: false,
    isNew: false,
  },
  
  // Diamonds
  {
    id: 18,
    name: "1캐럿 다이아몬드 솔리테어 링",
    weight: "1.02ct",
    purity: "GIA F/VS2",
    price: "12,500,000",
    image: diamondRing,
    category: "diamond",
    isBest: true,
    isNew: false,
  },
  {
    id: 19,
    name: "화이트골드 다이아몬드 목걸이",
    weight: "0.5ct",
    purity: "18K WG",
    price: "3,850,000",
    image: diamondNecklace,
    category: "diamond",
    isBest: false,
    isNew: true,
  },
  {
    id: 20,
    name: "5부 다이아몬드 웨딩 링",
    weight: "0.5ct",
    purity: "GIA E/SI1",
    price: "4,200,000",
    image: diamondRing,
    category: "diamond",
    isBest: false,
    isNew: false,
  },

  // Corporate Gifts
  {
    id: 21,
    name: "순금 감사패 (우드 케이스)",
    weight: "37.5g",
    purity: "99.9%",
    price: "5,800,000",
    image: corporatePlaque,
    category: "corporate",
    isBest: true,
    isNew: false,
  },
  {
    id: 12,
    name: "순금 행운의 열쇠 3.75g",
    weight: "3.75g",
    purity: "99.9%",
    price: "550,000",
    image: goldKey,
    category: "corporate", // Also Corporate
    isBest: true,
    isNew: false,
  },
  {
    id: 22,
    name: "기업 로고 순금 뱃지",
    weight: "3.75g",
    purity: "99.9%",
    price: "580,000",
    image: goldBar10gLS, // Using generic gold item for badge placeholder
    category: "corporate",
    isBest: false,
    isNew: true,
  },

  // Gift Gold (Commemorative) - Reusing items
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
  },

  // Events
  {
    id: 23,
    name: "[이벤트] 2025 신년 기념 골드 코인",
    weight: "3.75g",
    purity: "99.9%",
    price: "520,000",
    image: eventCoin,
    category: "event",
    isBest: false,
    isNew: true,
  },
  {
    id: 24,
    name: "[특가] 골드바 10g + 실버바 100g 세트",
    weight: "110g",
    purity: "99.9%",
    price: "1,720,000",
    image: goldBar10gLS,
    category: "event",
    isBest: true,
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
