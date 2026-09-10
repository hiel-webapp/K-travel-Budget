import dotenv from "dotenv";
import path from "path";
import axios from "axios";
import fs from "fs";
import { ALL_FOOD_ITEMS } from "../src/features/budget/catalog/food-catalog";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const apiKey = process.env.KTO_API_KEY;

// 한식 검색 키워드 정제 맵 (더 정확한 검색을 위한 키워드)
const SEARCH_KEYWORD_MAP: Record<string, string> = {
  "nat_samgyeopsal": "삼겹살",
  "nat_korean_bbq_galbi": "소갈비",
  "nat_hanjeongsik": "한정식",
  "nat_tteokbokki_platter": "떡볶이",
  "nat_k_fried_chicken": "치킨",
  "nat_bibimbap": "비빔밥",
  "nat_kimchi_jjigae": "김치찌개",
  "nat_doenjang_jjigae": "된장찌개",
  "nat_samgyetang": "삼계탕",
  "nat_sundubu_jjigae": "순두부찌개",
  "nat_naengmyeon": "냉면",
  "nat_dakgalbi": "닭갈비",
  "nat_pajeon_makgeolli": "해물파전",
  "nat_kimbap_ramen": "김밥",
  "nat_bingsu": "빙수",
  "nat_galbitang": "갈비탕",
  "nat_bossam": "보쌈",
  "nat_gamjatang": "감자탕",
  "nat_shabu_shabu": "샤브샤브",
  "nat_jjajangmyeon_mandu": "자장면",
  
  // 서울
  "food_seoul_1": "닭한마리",
  "food_seoul_2": "빈대떡",
  "food_seoul_3": "설렁탕",
  "food_seoul_4": "즉석떡볶이",
  "food_seoul_5": "부대찌개",
  "food_seoul_6": "곰탕",
  "food_seoul_7": "생선구이",
  "food_seoul_8": "마장동 한우",
  "food_seoul_9": "족발",
  "food_seoul_10": "칼국수",

  // 부산
  "food_busan_1": "돼지국밥",
  "food_busan_2": "밀면",
  "food_busan_3": "씨앗호떡",
  "food_busan_4": "어묵",
  "food_busan_5": "꼼장어",
  "food_busan_6": "낙곱새",
  "food_busan_7": "동래파전",
  "food_busan_8": "생선회",
  "food_busan_9": "완당",
  "food_busan_10": "복국",

  // 제주
  "food_jeju_1": "흑돼지",
  "food_jeju_2": "고기국수",
  "food_jeju_3": "갈치조림",
  "food_jeju_4": "전복뚝배기",
  "food_jeju_5": "오메기떡",
  "food_jeju_6": "물회",
  "food_jeju_7": "보말칼국수",
  "food_jeju_8": "옥돔구이",
  "food_jeju_9": "몸국",
  "food_jeju_10": "당근케이크",

  // 전주
  "food_jeonju_1": "전주비빔밥",
  "food_jeonju_2": "콩나물국밥",
  "food_jeonju_3": "초코파이",
  "food_jeonju_4": "떡갈비",
  "food_jeonju_5": "물짜장",
  "food_jeonju_6": "가맥",
  "food_jeonju_7": "돌솥비빔밥",
  "food_jeonju_8": "피순대",
  "food_jeonju_9": "모주",
  "food_jeonju_10": "백반",

  // 강릉
  "food_gangneung_1": "초당순두부",
  "food_gangneung_2": "장칼국수",
  "food_gangneung_3": "커피",
  "food_gangneung_4": "꼬막비빔밥",
  "food_gangneung_5": "오징어순대",
  "food_gangneung_6": "마늘빵",
  "food_gangneung_7": "물회",
  "food_gangneung_8": "감자옹심이",
  "food_gangneung_9": "막국수",
  "food_gangneung_10": "닭강정",

  // 경주
  "food_gyeongju_1": "황남빵",
  "food_gyeongju_2": "한우물회",
  "food_gyeongju_3": "쌈밥",
  "food_gyeongju_4": "교리김밥",
  "food_gyeongju_5": "순두부찌개",
  "food_gyeongju_6": "밀면",
  "food_gyeongju_7": "육회비빔밥",
  "food_gyeongju_8": "떡갈비",
  "food_gyeongju_9": "찰보리빵",
  "food_gyeongju_10": "묵밥",

  // 인천
  "food_incheon_1": "차이나타운 자장면",
  "food_incheon_2": "신포닭강정",
  "food_incheon_3": "화덕만두",
  "food_incheon_4": "물텀벙",
  "food_incheon_5": "백짬뽕",
  "food_incheon_6": "쫄면",
  "food_incheon_7": "조개구이",
  "food_incheon_8": "칼국수",
  "food_incheon_9": "꽃게탕",
  "food_incheon_10": "공갈빵",

  // 수원
  "food_suwon_1": "왕갈비",
  "food_suwon_2": "통닭",
  "food_suwon_3": "순대",
  "food_suwon_4": "갈비탕",
  "food_suwon_5": "칼국수",
  "food_suwon_6": "평양냉면",
  "food_suwon_7": "만두",
  "food_suwon_8": "부대찌개",
  "food_suwon_9": "설렁탕",
  "food_suwon_10": "추어탕",

  // 여수
  "food_yeosu_1": "돌게장",
  "food_yeosu_2": "해물삼합",
  "food_yeosu_3": "서대회",
  "food_yeosu_4": "갓김치",
  "food_yeosu_5": "하모샤브샤브",
  "food_yeosu_6": "선어회",
  "food_yeosu_7": "갈치조림",
  "food_yeosu_8": "굴구이",
  "food_yeosu_9": "장어탕",
  "food_yeosu_10": "바다김밥",

  // 속초
  "food_sokcho_1": "만석닭강정",
  "food_sokcho_2": "아바이순대",
  "food_sokcho_3": "물회",
  "food_sokcho_4": "오징어순대",
  "food_sokcho_5": "생선구이",
  "food_sokcho_6": "홍게",
  "food_sokcho_7": "섭국",
  "food_sokcho_8": "장칼국수",
  "food_sokcho_9": "씨앗호떡",
  "food_sokcho_10": "감자전"
};

async function searchKtoImage(keyword: string): Promise<string | null> {
  if (!apiKey) return null;
  try {
    // 1차: contentTypeId=39 (음식점)
    const url = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(apiKey)}&MobileOS=ETC&MobileApp=HypeHeritage&_type=json&keyword=${encodeURIComponent(keyword)}&contentTypeId=39&numOfRows=5&pageNo=1`;
    const res = await axios.get(url, { timeout: 5000 });
    const items = res.data?.response?.body?.items?.item;
    if (items && Array.isArray(items)) {
      const match = items.find((i: any) => i.firstimage || i.firstimage2);
      if (match) {
        return (match.firstimage || match.firstimage2).replace("http://", "https://");
      }
    }

    // 2차: 전체 카테고리 검색
    const url2 = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(apiKey)}&MobileOS=ETC&MobileApp=HypeHeritage&_type=json&keyword=${encodeURIComponent(keyword)}&numOfRows=5&pageNo=1`;
    const res2 = await axios.get(url2, { timeout: 5000 });
    const items2 = res2.data?.response?.body?.items?.item;
    if (items2 && Array.isArray(items2)) {
      const match2 = items2.find((i: any) => i.firstimage || i.firstimage2);
      if (match2) {
        return (match2.firstimage || match2.firstimage2).replace("http://", "https://");
      }
    }
  } catch (e: any) {
    // 무시
  }
  return null;
}

async function main() {
  console.log(`🚀 [KTO Food Images] 120개 음식의 KTO TourAPI 공식 실사 이미지 매핑 시작...\n`);

  const imageMap: Record<string, string> = {};
  let foundCount = 0;

  for (let i = 0; i < ALL_FOOD_ITEMS.length; i++) {
    const item = ALL_FOOD_ITEMS[i];
    const kw = SEARCH_KEYWORD_MAP[item.id] || item.nameKo.split(" ")[0].replace(/[^가-힣]/g, "");
    
    const img = await searchKtoImage(kw);
    if (img) {
      imageMap[item.id] = img;
      foundCount++;
      console.log(`[${i + 1}/120] ✅ ${item.nameKo} (${kw}) -> ${img}`);
    } else {
      console.log(`[${i + 1}/120] ⚠️ ${item.nameKo} (${kw}) -> 이미지 없음`);
    }

    // API rate limit 방지 50ms 딜레이
    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`\n🎉 수집 완료: 총 120개 중 ${foundCount}개 KTO 이미지 매핑 성공!`);

  // 결과를 JSON으로 저장
  fs.writeFileSync(
    path.resolve(process.cwd(), "scripts/food-kto-images.json"),
    JSON.stringify(imageMap, null, 2),
    "utf-8"
  );
  console.log("📁 scripts/food-kto-images.json 파일 저장 완료");
}

main();
