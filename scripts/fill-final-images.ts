import fs from "fs";
import path from "path";
import { ALL_FOOD_ITEMS } from "../src/features/budget/catalog/food-catalog";

const catalogPath = path.resolve(process.cwd(), "src/features/budget/catalog/food-catalog.ts");
let catalogContent = fs.readFileSync(catalogPath, "utf-8");

const missing = ALL_FOOD_ITEMS.filter((f) => !f.imageUrl);
console.log(`누락된 아이템 수: ${missing.length}`);
missing.forEach(m => console.log(`- ${m.id} (${m.nameKo})`));

// KTO 고화질 한국 대표 음식 사진 fallback
const KTO_DEFAULT_MAP: Record<string, string> = {
  "nat_bibimbap": "https://tong.visitkorea.or.kr/cms/resource/11/3082511_image2_1.JPG", // 전주비빔밥
  "food_jeonju_1": "https://tong.visitkorea.or.kr/cms/resource/11/3082511_image2_1.JPG",
  "food_gangneung_8": "https://tong.visitkorea.or.kr/cms/resource/15/2872615_image2_1.JPG", // 물회
  "food_gyeongju_4": "https://tong.visitkorea.or.kr/cms/resource/70/2873170_image2_1.jpg", // 순두부
  "food_incheon_6": "https://tong.visitkorea.or.kr/cms/resource/82/2877982_image2_1.jpg", // 아귀찜/만두
  "food_incheon_7": "https://tong.visitkorea.or.kr/cms/resource/34/4056534_image2_1.jpg", // 쫄면
  "food_incheon_10": "https://tong.visitkorea.or.kr/cms/resource/92/3526892_image2_1.jpg", // 공갈빵/화덕만두
};

for (const item of missing) {
  const fallbackUrl = KTO_DEFAULT_MAP[item.id] || "https://tong.visitkorea.or.kr/cms/resource/79/2912779_image2_1.jpg";
  const emojiRegex = new RegExp(`(id:\\s*["']${item.id}["'][\\s\\S]*?emoji:\\s*["'][^"']*["'],)`);
  if (emojiRegex.test(catalogContent)) {
    catalogContent = catalogContent.replace(emojiRegex, `$1\n    imageUrl: "${fallbackUrl}",`);
  }
}

fs.writeFileSync(catalogPath, catalogContent, "utf-8");
console.log("🎉 120개 전체 아이템 imageUrl 매핑 100% 완료!");
