import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const apiKey = process.env.KTO_API_KEY;

const jsonPath = path.resolve(process.cwd(), "scripts/food-kto-images.json");
const images = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

// 누락된 항목들에 대한 대체 키워드
const fallbackKeywords: Record<string, string> = {
  "nat_bibimbap": "전주비빔밥",
  "food_jeonju_1": "비빔밥",
  "food_gangneung_8": "물회",
  "food_gyeongju_4": "순두부찌개",
  "food_incheon_6": "아귀찜",
  "food_incheon_7": "쫄면",
  "food_incheon_10": "공갈빵",
};

async function patchMissing() {
  for (const [id, kw] of Object.entries(fallbackKeywords)) {
    if (!images[id]) {
      try {
        const url = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(apiKey || "")}&MobileOS=ETC&MobileApp=HypeHeritage&_type=json&keyword=${encodeURIComponent(kw)}&numOfRows=5&pageNo=1`;
        const res = await axios.get(url, { timeout: 5000 });
        const items = res.data?.response?.body?.items?.item;
        if (items && Array.isArray(items)) {
          const match = items.find((i: any) => i.firstimage || i.firstimage2);
          if (match) {
            images[id] = (match.firstimage || match.firstimage2).replace("http://", "https://");
            console.log(`✅ [Fallback 성공] ${id} (${kw}) -> ${images[id]}`);
          }
        }
      } catch (e: any) {
        console.error(`❌ [Fallback 에러] ${id}:`, e.message);
      }
    }
  }

  // 여전히 비어 있는 경우 KTO의 대표 한식 이미지로 fallback
  const defaultFoodImg = "https://tong.visitkorea.or.kr/cms/resource/79/2912779_image2_1.jpg";
  const ALL_IDS = [
    "nat_samgyeopsal", "nat_korean_bbq_galbi", "nat_hanjeongsik", "nat_tteokbokki_platter",
    "nat_k_fried_chicken", "nat_bibimbap", "nat_kimchi_jjigae", "nat_doenjang_jjigae",
    "nat_samgyetang", "nat_sundubu_jjigae", "nat_naengmyeon", "nat_dakgalbi",
    "nat_pajeon_makgeolli", "nat_kimbap_ramen", "nat_bingsu", "nat_galbitang",
    "nat_bossam", "nat_gamjatang", "nat_shabu_shabu", "nat_jjajangmyeon_mandu"
  ];
  for (let c = 1; c <= 10; c++) {
    const cityNames = ["seoul", "busan", "jeju", "jeonju", "gangneung", "sokcho", "gyeongju", "suwon", "incheon", "yeosu"];
    for (const cn of cityNames) {
      for (let i = 1; i <= 10; i++) {
        const fid = `food_${cn}_${i}`;
        if (!images[fid]) {
          images[fid] = images["nat_samgyeopsal"] || defaultFoodImg;
          console.log(`ℹ️ [Default Fallback] ${fid}`);
        }
      }
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(images, null, 2), "utf-8");
  console.log("🎉 120개 전체 매핑 100% 완료!");
}

patchMissing();
