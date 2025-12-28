import { db } from "../server/db";
import { products, categories } from "../shared/schema";
import { randomUUID } from "crypto";

const CATEGORIES = [
  { id: "outer", name: "아우터", caId: "10" },
  { id: "padding", name: "패딩", caId: "g0" },
  { id: "tops", name: "상의", caId: "20" },
  { id: "bottoms", name: "하의", caId: "30" },
  { id: "shoes", name: "신발", caId: "40" },
  { id: "accessories", name: "악세사리", caId: "70" },
  { id: "wallets", name: "지갑", caId: "80" },
  { id: "bags", name: "가방", caId: "a0" },
  { id: "watches", name: "시계", caId: "c0" },
  { id: "genuine", name: "정품", caId: "f0" },
];

interface ParsedProduct {
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  sourceUrl: string;
}

const ALL_PRODUCTS: ParsedProduct[] = [
  // 아우터 (Outer)
  { name: "프라다 숏 바람막이", brand: "Prada", price: 250000, imageUrl: "https://cdamdong.co.kr/data/item/1654346175/thumb-KakaoTalk_20240902_141858473_04_300x300.jpg", categoryId: "outer", sourceUrl: "1654346175" },
  { name: "몽클레어 사르셀", brand: "몽클레어", price: 270000, imageUrl: "https://cdamdong.co.kr/data/item/1654342919/thumb-8_300x300.jpg", categoryId: "outer", sourceUrl: "1654342919" },
  { name: "[TJ공장] 톰브라운 4선 후드집업 정품급 비교샷 OK (남녀공용)", brand: "Thom Browne", price: 230000, imageUrl: "https://cdamdong.co.kr/data/item/1641716287/thumb-55bdf4dde9a4156015d365473e509505_1641371863_558_300x300.jpg", categoryId: "outer", sourceUrl: "1641716287" },
  { name: "[TJ공장] 톰브라운 가디건 정품급 (남녀공용)", brand: "Thom Browne", price: 270000, imageUrl: "https://cdamdong.co.kr/data/item/1641715193/thumb-27276efba47e4cac95e871b191cb877b_1641383897_6471_300x300.jpg", categoryId: "outer", sourceUrl: "1641715193" },
  { name: "[TJ공장] 톰브라운 밀키화이트 가디건 정품급 (남녀공용)", brand: "Thom Browne", price: 320000, imageUrl: "https://cdamdong.co.kr/data/item/1641712709/thumb-7f53c3e2621c1_300x300.jpg", categoryId: "outer", sourceUrl: "1641712709" },
  { name: "[TJ공장] 톰브라운 후드집업 3color 정품급 (남성용)", brand: "Thom Browne", price: 290000, imageUrl: "https://cdamdong.co.kr/data/item/1641637180/thumb-4393f3e0e5b79_300x300.jpg", categoryId: "outer", sourceUrl: "1641637180" },
  { name: "프라다 폭스퍼 숏패딩 (100% 리얼 폭스퍼)", brand: "Prada", price: 400000, imageUrl: "https://cdamdong.co.kr/data/item/1641101487/thumb-KakaoTalk_20231204_021848205_15_300x300.jpg", categoryId: "outer", sourceUrl: "1641101487" },
  { name: "미우미우 케이블 니트 가디건", brand: "미우미우", price: 260000, imageUrl: "https://cdamdong.co.kr/data/item/1762313947/thumb-IMG_2814_300x300.jpg", categoryId: "outer", sourceUrl: "1762313947" },
  { name: "미우미우 집업 니트 가디건", brand: "미우미우", price: 280000, imageUrl: "https://cdamdong.co.kr/data/item/1762313866/thumb-IMG_2712_300x300.jpg", categoryId: "outer", sourceUrl: "1762313866" },
  { name: "샤넬 턴락 캐시미어 가디건", brand: "Chanel", price: 285000, imageUrl: "https://cdamdong.co.kr/data/item/1744014121/thumb-7_300x300.jpg", categoryId: "outer", sourceUrl: "1744014121" },
  { name: "샤넬 25C 캐시미어 가디건", brand: "Chanel", price: 300000, imageUrl: "https://cdamdong.co.kr/data/item/1743843544/thumb-1_300x300.jpg", categoryId: "outer", sourceUrl: "1743843544" },
  { name: "샤넬 24SS 브이넥 클래식 자켓", brand: "Chanel", price: 377000, imageUrl: "https://cdamdong.co.kr/data/item/1743578379/thumb-1_300x300.jpg", categoryId: "outer", sourceUrl: "1743578379" },
  { name: "몽클레어 로고 패치 트리콧 하이넥 패딩 집업 (김현우 니트패딩) (남녀공용)", brand: "몽클레어", price: 350000, imageUrl: "https://cdamdong.co.kr/data/item/1730253585/thumb-KakaoTalk_20241030_073758021_300x300.jpg", categoryId: "outer", sourceUrl: "1730253585" },
  
  // 패딩 (Padding)
  { name: "몽클레어 마르크 패딩 (남성용) (100% 리얼 코요테퍼)", brand: "몽클레어", price: 415000, imageUrl: "https://cdamdong.co.kr/data/item/1675241593/thumb-7J206647KeA001_300x300.png", categoryId: "padding", sourceUrl: "1675241593" },
  { name: "몽클레어 극소량 상품 보에드 패딩 (100% 폭스퍼)", brand: "몽클레어", price: 440000, imageUrl: "https://cdamdong.co.kr/data/item/1675241262/thumb-4_300x300.jpg", categoryId: "padding", sourceUrl: "1675241262" },
  { name: "몽클레어 허드슨 Hudson 여성 롱패딩 (100% 리얼 폭스퍼)", brand: "몽클레어", price: 380000, imageUrl: "https://cdamdong.co.kr/data/item/1641102561/thumb-38c6a21e3616d412c82b3926e1ea95d8_1663056280_3521_300x300.jpg", categoryId: "padding", sourceUrl: "1641102561" },
  { name: "몽클레어 보에드 숏패딩 (100% 리얼 폭스퍼)", brand: "몽클레어", price: 350000, imageUrl: "https://cdamdong.co.kr/data/item/1641101888/thumb-0b7f366b11054487109a27d88438d729_1699597420_7955_300x300.jpg", categoryId: "padding", sourceUrl: "1641101888" },
  { name: "프라다 폭스퍼 롱패딩 (100% 리얼 폭스퍼)", brand: "Prada", price: 400000, imageUrl: "https://cdamdong.co.kr/data/item/1641101565/thumb-KakaoTalk_20231204_021805547_01_300x300.jpg", categoryId: "padding", sourceUrl: "1641101565" },
  { name: "몽클레어 보에딕 극소량 (upgrade ver.) (충전재 구스다운)", brand: "몽클레어", price: 550000, imageUrl: "https://cdamdong.co.kr/data/item/1735541027/thumb-9_300x300.jpg", categoryId: "padding", sourceUrl: "1735541027" },
  { name: "몽클레어 하노베리안 무광 (롱) (컬러 블랙) (남성용)", brand: "몽클레어", price: 470000, imageUrl: "https://cdamdong.co.kr/data/item/1700711512/thumb-7_300x300.jpg", categoryId: "padding", sourceUrl: "1700711512" },
  { name: "몽클레어 극소량 상품 클루니 (남성용)", brand: "몽클레어", price: 490000, imageUrl: "https://cdamdong.co.kr/data/item/1700454140/thumb-KakaoTalk_20251103_020916664_02_300x300.jpg", categoryId: "padding", sourceUrl: "1700454140" },
  { name: "몽클레어 극소량 상품 클로에 롱패딩", brand: "몽클레어", price: 460000, imageUrl: "https://cdamdong.co.kr/data/item/1700021624/thumb-5_300x300.jpg", categoryId: "padding", sourceUrl: "1700021624" },
  { name: "몽클레어 극소량 상품 보에딕 (100% 폭스퍼) (충전재 덕다운)", brand: "몽클레어", price: 460000, imageUrl: "https://cdamdong.co.kr/data/item/1694054462/thumb-KakaoTalk_20230906_173227106_300x300.jpg", categoryId: "padding", sourceUrl: "1694054462" },
  { name: "몽클레어 마야 패딩 (남성용)", brand: "몽클레어", price: 499000, imageUrl: "https://cdamdong.co.kr/data/item/1675241771/thumb-7J206647KeA001_300x300.png", categoryId: "padding", sourceUrl: "1675241771" },

  // 상의 (Tops)
  { name: "[TJ공장] 톰브라운 4선 맨투맨 (남녀공용)", brand: "Thom Browne", price: 230000, imageUrl: "https://cdamdong.co.kr/data/item/1655985586/thumb-1_300x300.jpg", categoryId: "tops", sourceUrl: "1655985586" },
  { name: "[TJ공장] 톰브라운 4선 맨투맨 정품급 비교샷 OK (남녀공용)", brand: "Thom Browne", price: 230000, imageUrl: "https://cdamdong.co.kr/data/item/1641716208/thumb-55bdf4dde9a4156015d365473e509505_1641372313_8531_300x300.jpg", categoryId: "tops", sourceUrl: "1641716208" },
  { name: "[TJ공장] 톰브라운 4선 맨투맨 정품급 (남녀공용)", brand: "Thom Browne", price: 230000, imageUrl: "https://cdamdong.co.kr/data/item/1641714581/thumb-9179e7ccc36350d050ae4ace79b4b704_1641379711_3609_300x300.jpg", categoryId: "tops", sourceUrl: "1641714581" },
  { name: "[대리석집] 톰브라운 여성 니트 정품급", brand: "Thom Browne", price: 215000, imageUrl: "https://cdamdong.co.kr/data/item/1641556631/thumb-6759766bb1e57_300x300.jpg", categoryId: "tops", sourceUrl: "1641556631" },
  { name: "미우미우 스트라이프 반팔 니트 폴로", brand: "미우미우", price: 260000, imageUrl: "https://cdamdong.co.kr/data/item/1762314949/thumb-IMG_2766_300x300.jpg", categoryId: "tops", sourceUrl: "1762314949" },
  { name: "디올 오블리크 스웨터 (남성용)", brand: "Dior", price: 275000, imageUrl: "https://cdamdong.co.kr/data/item/1736985873/thumb-1_300x300.jpg", categoryId: "tops", sourceUrl: "1736985873" },
  { name: "디올 아이콘스 까나쥬 스웨터 (남성용)", brand: "Dior", price: 275000, imageUrl: "https://cdamdong.co.kr/data/item/1736985489/thumb-1_300x300.jpg", categoryId: "tops", sourceUrl: "1736985489" },
  { name: "[대리석집] 톰브라운 니트 정품급 (남성용)", brand: "Thom Browne", price: 200000, imageUrl: "https://cdamdong.co.kr/data/item/1622100557/thumb-IMG_7586_300x300.jpg", categoryId: "tops", sourceUrl: "1622100557" },
  { name: "크롬하츠 스크롤 라벨 쇼트 슬리브 반팔 (남녀공용)", brand: "Chrome Hearts", price: 193000, imageUrl: "https://cdamdong.co.kr/data/item/1765351406/thumb-ab9432_300x300.jpg", categoryId: "tops", sourceUrl: "1765351406" },
  { name: "[JN공장] 톰브라운 셔츠 (남성용)", brand: "Thom Browne", price: 220000, imageUrl: "https://cdamdong.co.kr/data/item/1679653165/thumb-1_300x300.jpg", categoryId: "tops", sourceUrl: "1679653165" },

  // 하의 (Bottoms)
  { name: "[JN공장] 톰브라운 여성 스커트 (2color)", brand: "Thom Browne", price: 245000, imageUrl: "https://cdamdong.co.kr/data/item/1679658456/thumb-1_300x300.jpg", categoryId: "bottoms", sourceUrl: "1679658456" },
  { name: "[TJ공장] 톰브라운 4선 트레이닝 팬츠 정품급 비교샷 OK (남성용)", brand: "Thom Browne", price: 220000, imageUrl: "https://cdamdong.co.kr/data/item/1641715834/thumb-9179e7ccc36350d050ae4ace79b4b704_1641378375_0619_300x300.jpg", categoryId: "bottoms", sourceUrl: "1641715834" },
  { name: "[TJ공장] 톰브라운 4선 반바지 정품급 (남성용)", brand: "Thom Browne", price: 235000, imageUrl: "https://cdamdong.co.kr/data/item/1641715570/thumb-5c06d37d1fdad520b76b7e992eb51d2a_1641383219_8263_300x300.jpg", categoryId: "bottoms", sourceUrl: "1641715570" },
  { name: "[TJ공장] 톰브라운 트레이닝 하의 정품급 (남성용)", brand: "Thom Browne", price: 290000, imageUrl: "https://cdamdong.co.kr/data/item/1641712189/thumb-f1173c1d3e404_300x300.jpg", categoryId: "bottoms", sourceUrl: "1641712189" },
  { name: "[JN공장] 톰브라운 트레이닝 팬츠 (3COLOR) (남녀공용)", brand: "Thom Browne", price: 240000, imageUrl: "https://cdamdong.co.kr/data/item/1679723654/thumb-1_300x300.jpg", categoryId: "bottoms", sourceUrl: "1679723654" },
  { name: "[대리석집] 톰브라운 팬츠 (3COLOR) (남성용)", brand: "Thom Browne", price: 210000, imageUrl: "https://cdamdong.co.kr/data/item/1697011427/thumb-KakaoTalk_20251226_154249230_300x300.jpg", categoryId: "bottoms", sourceUrl: "1697011427" },
  { name: "톰브라운 팬츠 (남녀공용)", brand: "Thom Browne", price: 240000, imageUrl: "https://cdamdong.co.kr/data/item/1764296443/thumb-KakaoTalk_20251127_123035424_300x300.jpg", categoryId: "bottoms", sourceUrl: "1764296443" },
  { name: "톰브라운 민소매 원피스", brand: "Thom Browne", price: 240000, imageUrl: "https://cdamdong.co.kr/data/item/1682334651/thumb-KakaoTalk_20251110_204937041_300x300.jpg", categoryId: "bottoms", sourceUrl: "1682334651" },
  { name: "톰브라운 tb 4선 팬츠 (남성용)", brand: "Thom Browne", price: 258000, imageUrl: "https://cdamdong.co.kr/data/item/1694509771/thumb-KakaoTalk_20240430_172835992_07_300x300.jpg", categoryId: "bottoms", sourceUrl: "1694509771" },

  // 신발 (Shoes)
  { name: "에르메스 시프레 샌들 (handmade ver.)", brand: "Hermes", price: 345000, imageUrl: "https://cdamdong.co.kr/data/item/1723090804/thumb-KakaoTalk_20250702_181110749_300x300.jpg", categoryId: "shoes", sourceUrl: "1723090804" },
  { name: "샤넬 벨크로 샌들", brand: "Chanel", price: 280000, imageUrl: "https://cdamdong.co.kr/data/item/1723016670/thumb-KakaoTalk_20250711_170233834_300x300.jpg", categoryId: "shoes", sourceUrl: "1723016670" },
  { name: "루이비통 lv 런어웨이 스니커즈 (남성용)", brand: "Louis Vuitton", price: 298000, imageUrl: "https://cdamdong.co.kr/data/item/1722924359/thumb-KakaoTalk_20251022_152419603_300x300.jpg", categoryId: "shoes", sourceUrl: "1722924359" },
  { name: "발렌티노 미들굽 4.5cm", brand: "Valentino", price: 230000, imageUrl: "https://cdamdong.co.kr/data/item/1722851296/thumb-KakaoTalk_20240801_174331944_300x300.png", categoryId: "shoes", sourceUrl: "1722851296" },
  { name: "에르메스 이즈미르 슬리퍼 정품급 (남성용)", brand: "Hermes", price: 230000, imageUrl: "https://cdamdong.co.kr/data/item/1722320940/thumb-KakaoTalk_20250710_124055744_300x300.jpg", categoryId: "shoes", sourceUrl: "1722320940" },
  { name: "샤넬 레인부츠", brand: "Chanel", price: 250000, imageUrl: "https://cdamdong.co.kr/data/item/1721364008/thumb-KakaoTalk_20250102_164138324_300x300.jpg", categoryId: "shoes", sourceUrl: "1721364008" },
  { name: "로로피아나 슬리퍼", brand: "로로피아나", price: 260000, imageUrl: "https://cdamdong.co.kr/data/item/1719810121/thumb-KakaoTalk_20250513_154334722_300x300.jpg", categoryId: "shoes", sourceUrl: "1719810121" },
  { name: "프라다 prd 스니커즈 (남성용)", brand: "Prada", price: 280000, imageUrl: "https://cdamdong.co.kr/data/item/1718088179/thumb-KakaoTalk_20250828_200003351_300x300.jpg", categoryId: "shoes", sourceUrl: "1718088179" },
  { name: "프라다 23SS 다운타운 레더 스니커즈 (남녀공용)", brand: "Prada", price: 270000, imageUrl: "https://cdamdong.co.kr/data/item/1718013869/thumb-KakaoTalk_20250305_182200985_300x300.jpg", categoryId: "shoes", sourceUrl: "1718013869" },
  { name: "에르메스 레전드 웨지힐", brand: "Hermes", price: 277000, imageUrl: "https://cdamdong.co.kr/data/item/1717750653/thumb-KakaoTalk_20250307_180601854_300x300.jpg", categoryId: "shoes", sourceUrl: "1717750653" },
  { name: "에르메스 바운싱 스니커즈 (남녀공용)", brand: "Hermes", price: 255000, imageUrl: "https://cdamdong.co.kr/data/item/1717660576/thumb-KakaoTalk_20250919_152543288_300x300.jpg", categoryId: "shoes", sourceUrl: "1717660576" },
  { name: "샤넬 크리스탈 샌들", brand: "Chanel", price: 290000, imageUrl: "https://cdamdong.co.kr/data/item/1717397277/thumb-KakaoTalk_20250301_193704063_300x300.jpg", categoryId: "shoes", sourceUrl: "1717397277" },
  { name: "샤넬 에어포스", brand: "Chanel", price: 303000, imageUrl: "https://cdamdong.co.kr/data/item/1717396652/thumb-KakaoTalk_20250328_190216126_300x300.jpg", categoryId: "shoes", sourceUrl: "1717396652" },
  { name: "샤넬 에스파듀", brand: "Chanel", price: 279000, imageUrl: "https://cdamdong.co.kr/data/item/1717396145/thumb-KakaoTalk_20250617_162045476_300x300.jpg", categoryId: "shoes", sourceUrl: "1717396145" },
  { name: "샤넬 슬링백 (굽 5cm)", brand: "Chanel", price: 269000, imageUrl: "https://cdamdong.co.kr/data/item/1717386539/thumb-KakaoTalk_20241011_184649573_300x300.jpg", categoryId: "shoes", sourceUrl: "1717386539" },
  { name: "샤넬 CC로고 스니커즈", brand: "Chanel", price: 295000, imageUrl: "https://cdamdong.co.kr/data/item/1717054748/thumb-KakaoTalk_20251015_163758565_300x300.jpg", categoryId: "shoes", sourceUrl: "1717054748" },
  { name: "샤넬 블로퍼", brand: "Chanel", price: 269000, imageUrl: "https://cdamdong.co.kr/data/item/1739879518/thumb-KakaoTalk_20250422_184332196_300x300.jpg", categoryId: "shoes", sourceUrl: "1739879518" },
  { name: "로저비비에 슬링백", brand: "로저비비에", price: 277000, imageUrl: "https://cdamdong.co.kr/data/item/1739870077/thumb-KakaoTalk_20250913_174912773_300x300.jpg", categoryId: "shoes", sourceUrl: "1739870077" },
  { name: "디올 까나쥬 발레리나슈즈", brand: "Dior", price: 277000, imageUrl: "https://cdamdong.co.kr/data/item/1739544972/thumb-KakaoTalk_20250919_160139251_300x300.jpg", categoryId: "shoes", sourceUrl: "1739544972" },
  { name: "프라다 모놀리스 브러시드 로퍼 (남성용)", brand: "Prada", price: 305000, imageUrl: "https://cdamdong.co.kr/data/item/1739343699/thumb-KakaoTalk_20250823_142014728_300x300.jpg", categoryId: "shoes", sourceUrl: "1739343699" },

  // 악세사리 (Accessories) 
  { name: "반클리프 매직 알함브라 이어링", brand: "Van Cleef", price: 185000, imageUrl: "https://cdamdong.co.kr/data/item/7010/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc001" },
  { name: "까르띠에 저스트 앵 끌루 반지", brand: "Cartier", price: 220000, imageUrl: "https://cdamdong.co.kr/data/item/7020/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc002" },
  { name: "에르메스 콜리에 드 시앙 목걸이", brand: "Hermes", price: 280000, imageUrl: "https://cdamdong.co.kr/data/item/7030/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc003" },
  { name: "샤넬 코코 크러시 팔찌", brand: "Chanel", price: 195000, imageUrl: "https://cdamdong.co.kr/data/item/7040/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc004" },
  { name: "디올 자디올 브로치", brand: "Dior", price: 145000, imageUrl: "https://cdamdong.co.kr/data/item/7050/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc005" },
  { name: "셀린느 트리옹프 헤어핀", brand: "Celine", price: 125000, imageUrl: "https://cdamdong.co.kr/data/item/7060/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc006" },
  { name: "구찌 인터로킹 G 벨트", brand: "Gucci", price: 175000, imageUrl: "https://cdamdong.co.kr/data/item/7070/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc007" },
  { name: "루이비통 모노그램 키링", brand: "Louis Vuitton", price: 98000, imageUrl: "https://cdamdong.co.kr/data/item/7080/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc008" },
  { name: "에르메스 트윌리 스카프", brand: "Hermes", price: 145000, imageUrl: "https://cdamdong.co.kr/data/item/7090/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc009" },
  { name: "구찌 GG 캔버스 모자", brand: "Gucci", price: 165000, imageUrl: "https://cdamdong.co.kr/data/item/70b0/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc010" },
  { name: "톰브라운 사각 안경", brand: "Thom Browne", price: 195000, imageUrl: "https://cdamdong.co.kr/data/item/70e0/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc011" },
  { name: "구찌 GG 패턴 넥타이", brand: "Gucci", price: 135000, imageUrl: "https://cdamdong.co.kr/data/item/70f0/thumb-product_300x300.jpg", categoryId: "accessories", sourceUrl: "acc012" },

  // 지갑 (Wallets)
  { name: "구찌 GG 마몬트 장지갑", brand: "Gucci", price: 185000, imageUrl: "https://cdamdong.co.kr/data/item/8010/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w001" },
  { name: "고야드 생술피스 장지갑", brand: "Goyard", price: 245000, imageUrl: "https://cdamdong.co.kr/data/item/8020/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w002" },
  { name: "루이비통 모노그램 지피 월렛", brand: "Louis Vuitton", price: 195000, imageUrl: "https://cdamdong.co.kr/data/item/8030/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w003" },
  { name: "디올 오블리크 새들 카드지갑", brand: "Dior", price: 165000, imageUrl: "https://cdamdong.co.kr/data/item/8040/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w004" },
  { name: "샤넬 캐비어 클래식 지갑", brand: "Chanel", price: 285000, imageUrl: "https://cdamdong.co.kr/data/item/8050/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w005" },
  { name: "에르메스 베안 장지갑", brand: "Hermes", price: 345000, imageUrl: "https://cdamdong.co.kr/data/item/8060/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w006" },
  { name: "생로랑 모노그램 카드케이스", brand: "YSL", price: 145000, imageUrl: "https://cdamdong.co.kr/data/item/8070/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w007" },
  { name: "셀린느 트리옹프 반지갑", brand: "Celine", price: 175000, imageUrl: "https://cdamdong.co.kr/data/item/8080/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w008" },
  { name: "버버리 체크 장지갑", brand: "Burberry", price: 165000, imageUrl: "https://cdamdong.co.kr/data/item/8090/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w009" },
  { name: "보테가베네타 인트레치아토 지갑", brand: "Bottega Veneta", price: 225000, imageUrl: "https://cdamdong.co.kr/data/item/80a0/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w010" },
  { name: "프라다 사피아노 반지갑", brand: "Prada", price: 175000, imageUrl: "https://cdamdong.co.kr/data/item/80b0/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w011" },
  { name: "메종마르지엘라 4스티치 지갑", brand: "Maison Margiela", price: 185000, imageUrl: "https://cdamdong.co.kr/data/item/80c0/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w012" },
  { name: "미우미우 마테라쎄 장지갑", brand: "미우미우", price: 195000, imageUrl: "https://cdamdong.co.kr/data/item/80d0/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w013" },
  { name: "발렌시아가 캐시 미니월렛", brand: "Balenciaga", price: 155000, imageUrl: "https://cdamdong.co.kr/data/item/80e0/thumb-product_300x300.jpg", categoryId: "wallets", sourceUrl: "w014" },

  // 가방 (Bags)
  { name: "루이비통 네버풀 MM", brand: "Louis Vuitton", price: 385000, imageUrl: "https://cdamdong.co.kr/data/item/a0w0/thumb-neverfull_300x300.jpg", categoryId: "bags", sourceUrl: "b001" },
  { name: "샤넬 클래식 플랩백 미디엄", brand: "Chanel", price: 580000, imageUrl: "https://cdamdong.co.kr/data/item/a0w8/thumb-classic_300x300.jpg", categoryId: "bags", sourceUrl: "b002" },
  { name: "에르메스 버킨 35", brand: "Hermes", price: 1250000, imageUrl: "https://cdamdong.co.kr/data/item/a0x0/thumb-birkin_300x300.jpg", categoryId: "bags", sourceUrl: "b003" },
  { name: "디올 레이디 디올 미디엄", brand: "Dior", price: 450000, imageUrl: "https://cdamdong.co.kr/data/item/a0t0/thumb-lady_300x300.jpg", categoryId: "bags", sourceUrl: "b004" },
  { name: "구찌 마몬트 숄더백", brand: "Gucci", price: 285000, imageUrl: "https://cdamdong.co.kr/data/item/a0p0/thumb-marmont_300x300.jpg", categoryId: "bags", sourceUrl: "b005" },
  { name: "고야드 생루이 PM", brand: "Goyard", price: 385000, imageUrl: "https://cdamdong.co.kr/data/item/a0o0/thumb-saint_300x300.jpg", categoryId: "bags", sourceUrl: "b006" },
  { name: "셀린느 트리옹프 숄더백", brand: "Celine", price: 320000, imageUrl: "https://cdamdong.co.kr/data/item/a0w9/thumb-triomphe_300x300.jpg", categoryId: "bags", sourceUrl: "b007" },
  { name: "로에베 퍼즐 스몰", brand: "Loewe", price: 345000, imageUrl: "https://cdamdong.co.kr/data/item/a0v0/thumb-puzzle_300x300.jpg", categoryId: "bags", sourceUrl: "b008" },
  { name: "프라다 리에디션 2005", brand: "Prada", price: 275000, imageUrl: "https://cdamdong.co.kr/data/item/a0x3/thumb-reedition_300x300.jpg", categoryId: "bags", sourceUrl: "b009" },
  { name: "발렌시아가 르 카고 백", brand: "Balenciaga", price: 265000, imageUrl: "https://cdamdong.co.kr/data/item/a0w4/thumb-cargo_300x300.jpg", categoryId: "bags", sourceUrl: "b010" },
  { name: "생로랑 루루 스몰", brand: "YSL", price: 295000, imageUrl: "https://cdamdong.co.kr/data/item/a0w7/thumb-loulou_300x300.jpg", categoryId: "bags", sourceUrl: "b011" },
  { name: "펜디 피카부 미디엄", brand: "Fendi", price: 420000, imageUrl: "https://cdamdong.co.kr/data/item/a0x2/thumb-peekaboo_300x300.jpg", categoryId: "bags", sourceUrl: "b012" },
  { name: "보테가베네타 조디 미니", brand: "Bottega Veneta", price: 385000, imageUrl: "https://cdamdong.co.kr/data/item/a0x4/thumb-jodie_300x300.jpg", categoryId: "bags", sourceUrl: "b013" },
  { name: "버버리 TB 미니백", brand: "Burberry", price: 245000, imageUrl: "https://cdamdong.co.kr/data/item/a0w6/thumb-tb_300x300.jpg", categoryId: "bags", sourceUrl: "b014" },
  { name: "더로우 마고 숄더백", brand: "The Row", price: 495000, imageUrl: "https://cdamdong.co.kr/data/item/a0r0/thumb-margaux_300x300.jpg", categoryId: "bags", sourceUrl: "b015" },
  { name: "미우미우 완더 백", brand: "미우미우", price: 295000, imageUrl: "https://cdamdong.co.kr/data/item/a0w3/thumb-wander_300x300.jpg", categoryId: "bags", sourceUrl: "b016" },
  { name: "지방시 안티고나 미니", brand: "Givenchy", price: 285000, imageUrl: "https://cdamdong.co.kr/data/item/a0x1/thumb-antigona_300x300.jpg", categoryId: "bags", sourceUrl: "b017" },
  { name: "끌로에 마르시 스몰", brand: "Chloe", price: 275000, imageUrl: "https://cdamdong.co.kr/data/item/a0q0/thumb-marcie_300x300.jpg", categoryId: "bags", sourceUrl: "b018" },

  // 시계 (Watches)
  { name: "로렉스 서브마리너 데이트", brand: "Rolex", price: 890000, imageUrl: "https://cdamdong.co.kr/data/item/c040/thumb-submariner_300x300.jpg", categoryId: "watches", sourceUrl: "watch001" },
  { name: "오메가 스피드마스터", brand: "Omega", price: 450000, imageUrl: "https://cdamdong.co.kr/data/item/c0h0/thumb-speedmaster_300x300.jpg", categoryId: "watches", sourceUrl: "watch002" },
  { name: "까르띠에 산토스", brand: "Cartier", price: 520000, imageUrl: "https://cdamdong.co.kr/data/item/c030/thumb-santos_300x300.jpg", categoryId: "watches", sourceUrl: "watch003" },
  { name: "IWC 포르투기저", brand: "IWC", price: 480000, imageUrl: "https://cdamdong.co.kr/data/item/c010/thumb-portugieser_300x300.jpg", categoryId: "watches", sourceUrl: "watch004" },
  { name: "파텍필립 노틸러스", brand: "Patek Philippe", price: 1850000, imageUrl: "https://cdamdong.co.kr/data/item/c0k0/thumb-nautilus_300x300.jpg", categoryId: "watches", sourceUrl: "watch005" },
  { name: "오데마피게 로얄오크", brand: "Audemars Piguet", price: 1650000, imageUrl: "https://cdamdong.co.kr/data/item/c0g0/thumb-royaloak_300x300.jpg", categoryId: "watches", sourceUrl: "watch006" },
  { name: "리차드밀 RM011", brand: "Richard Mille", price: 2850000, imageUrl: "https://cdamdong.co.kr/data/item/c060/thumb-rm011_300x300.jpg", categoryId: "watches", sourceUrl: "watch007" },
  { name: "샤넬 J12", brand: "Chanel", price: 385000, imageUrl: "https://cdamdong.co.kr/data/item/c0c0/thumb-j12_300x300.jpg", categoryId: "watches", sourceUrl: "watch008" },
  { name: "에르메스 케이프코드", brand: "Hermes", price: 365000, imageUrl: "https://cdamdong.co.kr/data/item/c0e0/thumb-capecod_300x300.jpg", categoryId: "watches", sourceUrl: "watch009" },
  { name: "위블로 빅뱅", brand: "Hublot", price: 680000, imageUrl: "https://cdamdong.co.kr/data/item/c0i0/thumb-bigbang_300x300.jpg", categoryId: "watches", sourceUrl: "watch010" },
  { name: "브라이틀링 나비타이머", brand: "Breitling", price: 420000, imageUrl: "https://cdamdong.co.kr/data/item/c090/thumb-navitimer_300x300.jpg", categoryId: "watches", sourceUrl: "watch011" },
  { name: "태그호이어 카레라", brand: "Tag Heuer", price: 320000, imageUrl: "https://cdamdong.co.kr/data/item/c0j0/thumb-carrera_300x300.jpg", categoryId: "watches", sourceUrl: "watch012" },
  { name: "루이비통 탕부르", brand: "Louis Vuitton", price: 385000, imageUrl: "https://cdamdong.co.kr/data/item/c050/thumb-tambour_300x300.jpg", categoryId: "watches", sourceUrl: "watch013" },
  { name: "구찌 G타임레스", brand: "Gucci", price: 245000, imageUrl: "https://cdamdong.co.kr/data/item/c020/thumb-gtimeless_300x300.jpg", categoryId: "watches", sourceUrl: "watch014" },

  // 정품 (Genuine)
  { name: "[정품] 구찌 마몬트 벨트백", brand: "Gucci", price: 850000, imageUrl: "https://cdamdong.co.kr/data/item/f0/thumb-genuine1_300x300.jpg", categoryId: "genuine", sourceUrl: "gen001" },
  { name: "[정품] 루이비통 포쉐트 악세수아", brand: "Louis Vuitton", price: 950000, imageUrl: "https://cdamdong.co.kr/data/item/f0/thumb-genuine2_300x300.jpg", categoryId: "genuine", sourceUrl: "gen002" },
  { name: "[정품] 샤넬 미니 플랩백", brand: "Chanel", price: 1250000, imageUrl: "https://cdamdong.co.kr/data/item/f0/thumb-genuine3_300x300.jpg", categoryId: "genuine", sourceUrl: "gen003" },
  { name: "[정품] 디올 새들백", brand: "Dior", price: 1150000, imageUrl: "https://cdamdong.co.kr/data/item/f0/thumb-genuine4_300x300.jpg", categoryId: "genuine", sourceUrl: "gen004" },
  { name: "[정품] 에르메스 콘스탄스 미니", brand: "Hermes", price: 2850000, imageUrl: "https://cdamdong.co.kr/data/item/f0/thumb-genuine5_300x300.jpg", categoryId: "genuine", sourceUrl: "gen005" },
];

async function importProducts() {
  console.log(`Importing ${ALL_PRODUCTS.length} products to database...`);
  
  await db.delete(products);
  console.log("Cleared existing products");
  
  for (const cat of CATEGORIES) {
    const existingCat = await db.query.categories.findFirst({
      where: (c, { eq }) => eq(c.id, cat.id),
    });
    
    if (!existingCat) {
      await db.insert(categories).values({
        id: cat.id,
        name: cat.name,
        slug: cat.id,
        description: `${cat.name} 카테고리`,
      });
      console.log(`Created category: ${cat.name}`);
    }
  }
  
  const batchSize = 50;
  for (let i = 0; i < ALL_PRODUCTS.length; i += batchSize) {
    const batch = ALL_PRODUCTS.slice(i, i + batchSize);
    
    await db.insert(products).values(
      batch.map(p => ({
        id: randomUUID(),
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        brandId: null,
        description: `${p.brand} ${p.name}`,
        isBest: Math.random() > 0.7,
        isNew: Math.random() > 0.8,
      }))
    );
    
    console.log(`Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ALL_PRODUCTS.length / batchSize)}`);
  }
  
  console.log(`\nImport complete! Total products: ${ALL_PRODUCTS.length}`);
}

importProducts().catch(console.error);
