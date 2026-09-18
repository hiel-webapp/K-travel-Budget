import fs from "fs";
import path from "path";
import {
  ATTRACTION_SPOTS_CATALOG,
} from "../src/features/budget/catalog/attraction-spots";
import {
  ALL_FOOD_ITEMS,
} from "../src/features/budget/catalog/food-catalog";

function escapeCsv(str?: string | number | null): string {
  if (str === undefined || str === null) return '""';
  const text = String(str).replace(/"/g, '""').replace(/\r?\n/g, " ");
  return `"${text}"`;
}

function run() {
  const rows: string[] = [];

  // CSV 헤더 (공공데이터 개방 표준 컬럼)
  const headers = [
    "구분",
    "데이터ID",
    "도시/지역코드",
    "명칭(한글)",
    "명칭(영문)",
    "카테고리/유형",
    "권장비용(KRW)",
    "설명(한글)",
    "설명(영문)",
    "교통/상세정보",
    "공식웹사이트/이미지",
    "공공데이터출처",
  ];
  rows.push(headers.map(escapeCsv).join(","));

  // 1. 한국관광공사 TourAPI 명소 데이터
  for (const spot of ATTRACTION_SPOTS_CATALOG) {
    if (!spot || !spot.nameKo) continue;
    rows.push(
      [
        "관광명소/체험",
        spot.id,
        spot.cityCode,
        spot.nameKo,
        spot.nameEn || "",
        spot.categoryType || spot.tag || "명소",
        spot.price || 0,
        spot.descKo || "",
        spot.descEn || "",
        spot.subwayInfoKo || spot.subwayInfo || "",
        spot.officialUrl || "",
        "한국관광공사 TourAPI 4.0 및 HypeHeritage 정제 DB",
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  // 2. 한국관광공사 실사/포토갤러리 연동 K-푸드 미식 데이터
  for (const food of ALL_FOOD_ITEMS) {
    if (!food || !food.nameKo) continue;
    rows.push(
      [
        "K-푸드/미식",
        food.id,
        food.scope === "NATIONAL" ? "NATIONAL" : (food as { cityCode?: string }).cityCode || "CITY",
        food.nameKo,
        food.nameEn || "",
        food.categoryTag || "미식",
        food.unitPriceKrw || 0,
        food.descKo || "",
        food.descEn || "",
        food.isMustEatTop3 ? "외국인 선호 Top 3 필수 미식" : "대표 미식",
        food.imageUrl || "",
        "한국관광공사 TourAPI 포토갤러리 및 HypeHeritage 예산 DB",
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  // UTF-8 with BOM (\uFEFF)
  const csvContent = "\uFEFF" + rows.join("\r\n");

  const outDir = path.resolve(__dirname, "../public/downloads");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const publicFilePath = path.join(outDir, "hypeheritage_kto_travel_catalog.csv");
  fs.writeFileSync(publicFilePath, csvContent, "utf8");

  const rootFilePath = path.resolve(__dirname, "../hypeheritage_kto_travel_catalog.csv");
  fs.writeFileSync(rootFilePath, csvContent, "utf8");

  console.log(`[SUCCESS] CSV 생성 완료: 총 ${rows.length - 1}개 레코드`);
  console.log(`- 다운로드용: ${publicFilePath}`);
  console.log(`- 루트 디렉토리: ${rootFilePath}`);
}

run();
