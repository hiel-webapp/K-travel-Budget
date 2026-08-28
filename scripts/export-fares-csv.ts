import fs from "fs";
import path from "path";
import { INTERCITY_FARE_TABLE } from "../src/lib/transport/intercity-fares";

async function exportTransitFaresCsv() {
  console.log("=== Google Sheets 호환 CSV 생성 시작 ===");

  const headers = [
    "출발도시",
    "도착도시",
    "구간코드",
    "교통수단",
    "한글명칭",
    "영문명칭",
    "편도요금(KRW)",
    "소요시간(한글)",
    "소요시간(영문)",
    "추천여부",
    "라벨",
    "검증기준처",
  ];

  const rows: string[][] = [headers];

  const cityKoreanNames: Record<string, string> = {
    SEOUL: "서울",
    BUSAN: "부산",
    JEJU: "제주",
    JEONJU: "전주",
    GYEONGJU: "경주",
    GANGNEUNG: "강릉",
    SUWON: "수원",
    YEOSU: "여수",
    SOKCHO: "속초",
    INCHEON: "인천공항",
  };

  for (const [routeKey, options] of Object.entries(INTERCITY_FARE_TABLE)) {
    const [from, to] = routeKey.split("-");
    const fromName = cityKoreanNames[from] || from;
    const toName = cityKoreanNames[to] || to;

    for (const opt of options) {
      let sourceName = "공식 전산망";
      if (opt.mode === "KTX" || opt.mode === "SRT") sourceName = "코레일/SRT 공식운임";
      else if (opt.mode === "EXPRESS_BUS") sourceName = "KOBUS/티머니 공식운임";
      else if (opt.mode === "FLIGHT") sourceName = "국내선 공시운임(공항세 포함)";

      rows.push([
        fromName,
        toName,
        routeKey,
        opt.mode,
        `"${opt.nameKo.replace(/"/g, '""')}"`,
        `"${opt.nameEn.replace(/"/g, '""')}"`,
        String(opt.oneWayPriceKrw),
        opt.durationTextKo,
        opt.durationTextEn,
        opt.isDefault ? "추천" : "선택",
        opt.badgeTextKo || "",
        sourceName,
      ]);
    }
  }

  // UTF-8 with BOM (\uFEFF) for perfect Google Sheets & Excel compatibility
  const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\r\n");

  const outputDir = path.resolve(process.cwd(), "public/downloads");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "korea_transit_fares_10cities.csv");
  fs.writeFileSync(outputPath, csvContent, "utf8");

  console.log(`✅ CSV 파일 생성 완료: ${outputPath}`);
  console.log(`총 ${rows.length - 1}개 교통 옵션 데이터가 Google Sheets 호환 규격으로 저장되었습니다.`);
}

exportTransitFaresCsv();
