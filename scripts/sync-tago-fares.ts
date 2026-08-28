import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fetchTrainSchedule, fetchExpBusSchedule, formatDurationTexts } from "../src/lib/tago/client";
import { CITY_TRAIN_STATION_MAP, CITY_BUS_TERMINAL_MAP } from "../src/lib/tago/constants";
import { SupportedCity } from "../src/lib/trip-domain";
import { INTERCITY_FARE_TABLE, IntercityFareInfo } from "../src/lib/transport/intercity-fares";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runTagoFareSync() {
  console.log("==========================================================");
  console.log("🚄 국토교통부(TAGO) 공식 열차 & 고속버스 요금 수집 및 파일 영구 반영");
  console.log("==========================================================");

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
    console.log(`\n🔍 [구간 조회] ${fromCity} ➔ ${toCity}`);

    // 1. KTX / 열차 요금 조회
    const fromStations = CITY_TRAIN_STATION_MAP[fromCity] || [];
    const toStations = CITY_TRAIN_STATION_MAP[toCity] || [];

    let ktxItemFound = false;

    for (const fStn of fromStations) {
      if (ktxItemFound) break;
      for (const tStn of toStations) {
        const trains = await fetchTrainSchedule(fStn.id, tStn.id);
        if (trains.length > 0) {
          const ktxList = trains.filter((t) => t.traingradename?.toUpperCase().includes("KTX") || t.traingradename?.includes("이음") || t.traingradename?.includes("새마을"));
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

            console.log(`  🚄 [${targetTrain.traingradename}] ${fStn.name}➔${tStn.name} : ₩${fare.toLocaleString()} (${durationMin}분)`);
            
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

            ktxItemFound = true;
            break;
          }
        }
      }
    }

    // 2. 고속버스 요금 조회
    const fromTerminals = CITY_BUS_TERMINAL_MAP[fromCity] || [];
    const toTerminals = CITY_BUS_TERMINAL_MAP[toCity] || [];

    let busItemFound = false;

    for (const fTrm of fromTerminals) {
      if (busItemFound) break;
      for (const tTrm of toTerminals) {
        const buses = await fetchExpBusSchedule(fTrm.id, tTrm.id);
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

            console.log(`  🚌 [${targetBus.gradeNm || "고속"}] ${fTrm.name}➔${tTrm.name} : ₩${fare.toLocaleString()} (${durationMin}분)`);
            
            const existingOptions = fareTableCopy[routeKey];
            if (existingOptions) {
              const busOpt = existingOptions.find((o) => o.mode === "EXPRESS_BUS");
              if (busOpt) {
                busOpt.oneWayPriceKrw = fare;
                const formatted = formatDurationTexts(durationMin);
                busOpt.durationTextKo = formatted.ko;
                busOpt.durationTextEn = formatted.en;
                updatedCount++;
              }
            }

            busItemFound = true;
            break;
          }
        }
      }
    }
  }

  // intercity-fares.ts 파일에 수집된 요금 테이블 덮어쓰기
  const targetFilePath = path.resolve(process.cwd(), "src/lib/transport/intercity-fares.ts");
  let fileContent = fs.readFileSync(targetFilePath, "utf8");

  const tableJson = JSON.stringify(fareTableCopy, null, 2);
  const updatedCode = `export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo[]> = ${tableJson};\n`;

  // 정규식으로 INTERCITY_FARE_TABLE 정의 부분 교체
  const regex = /export const INTERCITY_FARE_TABLE: Record<string, IntercityFareInfo\[\]> = \{[\s\S]*?\n\};\n/;
  if (regex.test(fileContent)) {
    fileContent = fileContent.replace(regex, updatedCode);
    fs.writeFileSync(targetFilePath, fileContent, "utf8");
    console.log(`\n💾 [파일 저장 완료] src/lib/transport/intercity-fares.ts 파일에 최신 TAGO 공식 요금이 영구 반영되었습니다.`);
  }

  console.log("\n==========================================================");
  console.log(`✅ 국토교통부 TAGO 실시간 공식 요금 동기화 완료!`);
  console.log(`총 ${updatedCount}개 항목의 공식 운임 및 소요시간 최신 동기화 완료.`);
  console.log("==========================================================");
}

runTagoFareSync();
