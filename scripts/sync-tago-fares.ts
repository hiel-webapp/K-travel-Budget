import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fetchTrainSchedule, fetchExpBusSchedule, fetchBusScheduleWithFallback, formatDurationTexts } from "../src/lib/tago/client";
import { CITY_TRAIN_STATION_MAP, CITY_BUS_TERMINAL_MAP } from "../src/lib/tago/constants";
import { SupportedCity } from "../src/lib/trip-domain";
import { INTERCITY_FARE_TABLE, IntercityFareInfo } from "../src/lib/transport/intercity-fares";
import { upsertAllFaresToDb } from "../src/lib/supabase/fares";
import { generateTransitFaresCsv } from "./export-fares-csv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runTagoFareSync() {
  console.log("==========================================================================");
  console.log("🚄 국토교통부(TAGO) 공식 열차 & 고속버스 요금 수집 ➔ Supabase DB & CSV 동기화");
  console.log("==========================================================================");

  const cityPairs: [SupportedCity, SupportedCity][] = [
    ["SEOUL", "BUSAN"],
    ["SEOUL", "JEONJU"],
    ["SEOUL", "GYEONGJU"],
    ["SEOUL", "GANGNEUNG"],
    ["SEOUL", "YEOSU"],
    ["SEOUL", "SUWON"],
    ["SEOUL", "SOKCHO"],
    ["BUSAN", "GYEONGJU"],
    ["BUSAN", "JEONJU"],
    ["BUSAN", "YEOSU"],
    ["BUSAN", "GANGNEUNG"],
    ["BUSAN", "SUWON"],
    ["BUSAN", "SOKCHO"],
    ["JEONJU", "YEOSU"],
    ["JEONJU", "GYEONGJU"],
    ["JEONJU", "GANGNEUNG"],
    ["JEONJU", "SUWON"],
    ["GYEONGJU", "GANGNEUNG"],
    ["GYEONGJU", "YEOSU"],
    ["GYEONGJU", "SUWON"],
    ["GANGNEUNG", "SOKCHO"],
    ["GANGNEUNG", "SUWON"],
    ["SUWON", "YEOSU"],
    ["SUWON", "SOKCHO"],
  ];

  const fareTableCopy: Record<string, IntercityFareInfo[]> = { ...INTERCITY_FARE_TABLE };
  let updatedCount = 0;

  for (const [fromCity, toCity] of cityPairs) {
    const routeKey = `${fromCity}-${toCity}`;

    // 1. KTX / 열차 요금 조회
    const fromStations = CITY_TRAIN_STATION_MAP[fromCity] || [];
    const toStations = CITY_TRAIN_STATION_MAP[toCity] || [];

    for (const fStn of fromStations) {
      let found = false;
      for (const tStn of toStations) {
        const trains = await fetchTrainSchedule(fStn.id, tStn.id);
        if (trains.length > 0) {
          const ktxList = trains.filter((t) => t.traingradename?.toUpperCase().includes("KTX") || t.traingradename?.includes("이음"));
          const targetTrain = ktxList.length > 0 ? ktxList[0] : trains[0];
          const fare = Number(targetTrain.adultcharge);

          if (fare > 0) {
            const depTimeStr = targetTrain.depplandtime;
            const arrTimeStr = targetTrain.arrplandtime;
            let durationMin = 120;
            if (depTimeStr && arrTimeStr && depTimeStr.length >= 12 && arrTimeStr.length >= 12) {
              const depH = parseInt(depTimeStr.slice(8, 10), 10);
              const depM = parseInt(depTimeStr.slice(10, 12), 10);
              const arrH = parseInt(arrTimeStr.slice(8, 10), 10);
              const arrM = parseInt(arrTimeStr.slice(10, 12), 10);
              durationMin = (arrH * 60 + arrM) - (depH * 60 + depM);
              if (durationMin < 0) durationMin += 1440;
            }

            const existingOptions = fareTableCopy[routeKey];
            if (existingOptions) {
              const ktxOpt = existingOptions.find((o) => o.mode === "KTX");
              if (ktxOpt) {
                ktxOpt.oneWayPriceKrw = fare;
                const formatted = formatDurationTexts(durationMin);
                ktxOpt.durationTextKo = formatted.ko;
                ktxOpt.durationTextEn = formatted.en;
                updatedCount++;
              }
            }
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }

    // 2. 버스 요금 조회 (고속버스 KOBUS ➔ 시외버스 BUSTAGO 2단계 자동 폴백)
    const fromTerminals = CITY_BUS_TERMINAL_MAP[fromCity] || [];
    const toTerminals = CITY_BUS_TERMINAL_MAP[toCity] || [];

    for (const fTrm of fromTerminals) {
      let found = false;
      for (const tTrm of toTerminals) {
        const { items: buses, networkType } = await fetchBusScheduleWithFallback(fTrm.id, tTrm.id);
        if (buses.length > 0) {
          const targetBus = buses.find((b) => b.gradeNm?.includes("우등")) || buses[0];
          const fare = Number(targetBus.charge);

          if (fare > 0) {
            const depTimeStr = String(targetBus.depPlandTime);
            const arrTimeStr = String(targetBus.arrPlandTime);
            let durationMin = 180;
            if (depTimeStr.length >= 12 && arrTimeStr.length >= 12) {
              const depH = parseInt(depTimeStr.slice(8, 10), 10);
              const depM = parseInt(depTimeStr.slice(10, 12), 10);
              const arrH = parseInt(arrTimeStr.slice(8, 10), 10);
              const arrM = parseInt(arrTimeStr.slice(10, 12), 10);
              durationMin = (arrH * 60 + arrM) - (depH * 60 + depM);
              if (durationMin < 0) durationMin += 1440;
            }

            const existingOptions = fareTableCopy[routeKey];
            if (existingOptions) {
              const busOpt = existingOptions.find((o) => o.mode === "EXPRESS_BUS");
              if (busOpt) {
                busOpt.oneWayPriceKrw = fare;
                const formatted = formatDurationTexts(durationMin);
                busOpt.durationTextKo = formatted.ko;
                busOpt.durationTextEn = formatted.en;
                updatedCount++;
                console.log(`[${networkType}] ${fromCity} ➔ ${toCity}: ₩${fare} (${formatted.ko})`);
              }
            }
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
  }

  // 1. intercity-fares.ts 로컬 캐시 덮어쓰기
  const targetFilePath = path.resolve(process.cwd(), "src/lib/transport/intercity-fares.ts");
  let fileContent = fs.readFileSync(targetFilePath, "utf8");
  const tableJson = JSON.stringify(fareTableCopy, null, 2);
  const updatedCode = `export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo[]> = ${tableJson};\n`;

  const regex = /export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo\[\]> = \{[\s\S]*?\n\};\n/;
  if (regex.test(fileContent)) {
    fileContent = fileContent.replace(regex, updatedCode);
    fs.writeFileSync(targetFilePath, fileContent, "utf8");
    console.log(`\n💾 [1] 로컬 초고속 캐시 파일(src/lib/transport/intercity-fares.ts) 갱신 완료.`);
  }

  // 2. Google Sheets 호환 CSV 파일 자동 생성 (공식 출처 사이트 및 URL 포함)
  await generateTransitFaresCsv(fareTableCopy);

  // 3. Supabase DB 저장
  const dbRes = await upsertAllFaresToDb(fareTableCopy);
  if (dbRes.success) {
    console.log(`💾 [3] Supabase DB (intercity_transport_fares)에 ${dbRes.count}개 항목 UPSERT 성공!`);
  } else {
    console.log(`ℹ️ [3] Supabase DB 동기화 대기: ${dbRes.error}`);
  }

  console.log("\n==========================================================================");
  console.log(`✅ TAGO 정기 배치, DB 동기화 및 Google Sheets CSV 생성 완료!`);
  console.log("==========================================================================");
}

runTagoFareSync();
