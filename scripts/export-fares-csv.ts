import fs from "fs";
import path from "path";
import { INTERCITY_FARE_TABLE, IntercityFareInfo } from "../src/lib/transport/intercity-fares";

export interface TransitSourceInfo {
  sourceName: string;
  sourceUrl: string;
}

export function getTransitSourceInfo(routeKey: string, opt: IntercityFareInfo): TransitSourceInfo {
  const [from, to] = routeKey.split("-");

  if (opt.mode === "KTX") {
    return {
      sourceName: "코레일(레츠코레일)",
      sourceUrl: "https://www.letskorail.com",
    };
  }
  if (opt.mode === "SRT") {
    if (routeKey.includes("INCHEON") || opt.nameKo.includes("일반열차")) {
      return {
        sourceName: "공항철도(AREX)",
        sourceUrl: "https://www.arex.or.kr",
      };
    }
    return {
      sourceName: "에스알(SRT)",
      sourceUrl: "https://etk.srail.kr",
    };
  }
  if (opt.mode === "EXPRESS_BUS") {
    if (opt.nameKo.includes("4100") || opt.nameKo.includes("4300")) {
      return {
        sourceName: "경기공항리무진",
        sourceUrl: "http://www.ggairportbus.co.kr",
      };
    }
    if (opt.nameKo.includes("6000") || opt.nameKo.includes("리무진")) {
      return {
        sourceName: "서울공항리무진",
        sourceUrl: "https://www.seoulairbus.com",
      };
    }
    if (opt.nameKo.includes("KOBUS")) {
      return {
        sourceName: "KOBUS(고속버스통합예매)",
        sourceUrl: "https://www.kobus.co.kr",
      };
    }
    return {
      sourceName: "KOBUS(고속버스통합예매)",
      sourceUrl: "https://www.kobus.co.kr",
    };
  }
  if (opt.mode === "INTERCITY_BUS") {
    return {
      sourceName: "버스타고(시외버스)",
      sourceUrl: "https://www.bustago.or.kr",
    };
  }
  if (opt.mode === "TRANSFER") {
    return {
      sourceName: "통합연계(코레일/버스타고/항공)",
      sourceUrl: "https://www.letskorail.com",
    };
  }
  if (opt.mode === "FLIGHT") {
    return {
      sourceName: "한국공항공사(KAC)",
      sourceUrl: "https://www.airport.co.kr",
    };
  }

  return {
    sourceName: "국토교통부 TAGO",
    sourceUrl: "https://www.data.go.kr",
  };
}

export async function generateTransitFaresCsv(fareTable: Record<string, IntercityFareInfo[]>) {
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
    "검증기준처_기관명",
    "공식_예매처_URL",
  ];

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

  const rows: string[][] = [headers];

  for (const [routeKey, options] of Object.entries(fareTable)) {
    const [from, to] = routeKey.split("-");
    const fromName = cityKoreanNames[from] || from;
    const toName = cityKoreanNames[to] || to;

    for (const opt of options) {
      const source = getTransitSourceInfo(routeKey, opt);

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
        source.sourceName,
        source.sourceUrl,
      ]);
    }
  }

  // UTF-8 with BOM (\uFEFF)
  const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\r\n");

  const outputDir = path.resolve(process.cwd(), "public/downloads");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "korea_transit_fares_10cities.csv");
  fs.writeFileSync(outputPath, csvContent, "utf8");

  console.log(`✅ CSV 파일 생성 완료: ${outputPath}`);
  console.log(`총 ${rows.length - 1}개 교통 옵션 (공식 출처 사이트 및 URL 링크 포함) 저장 완료.`);
}

if (process.argv[1]?.endsWith("export-fares-csv.ts")) {
  generateTransitFaresCsv(INTERCITY_FARE_TABLE);
}
