import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const RAW_KEY = process.env.DATA_GO_KR_API_KEY || process.env.KTO_API_KEY || "";

async function testTago() {
  console.log("=== TAGO 공공데이터 API 상세 진단 ===");
  console.log("인증키 앞자리:", RAW_KEY.slice(0, 10));

  const endpoints = [
    {
      name: "국토교통부_열차정보 (도시코드)",
      url: `http://apis.data.go.kr/1613000/TrainInfoService/getCtyCodeList?_type=json`,
    },
    {
      name: "국토교통부_고속버스 (터미널목록)",
      url: `http://apis.data.go.kr/1613000/ExpBusInfoService/getExpBusTrminlList?_type=json&numOfRows=5`,
    },
    {
      name: "국토교통부_시외버스 (터미널목록)",
      url: `http://apis.data.go.kr/1613000/SubTrmnlInfoService/getSubTrminlList?_type=json&numOfRows=5`,
    },
    {
      name: "한국관광공사_TourAPI (키 정상여부 대조용)",
      url: `http://apis.data.go.kr/B551011/KorService2/areaCode2?_type=json&MobileOS=ETC&MobileApp=HypeHeritage&numOfRows=5`,
    }
  ];

  for (const ep of endpoints) {
    console.log(`\n--- [테스트] ${ep.name} ---`);

    // 방식 1: raw serviceKey
    try {
      const u1 = `${ep.url}&serviceKey=${RAW_KEY}`;
      const res1 = await fetch(u1, { signal: AbortSignal.timeout(5000) });
      const text1 = await res1.text();
      console.log(`  (1) Raw Key: 상태 ${res1.status} | 결과:`, text1.slice(0, 150));
    } catch (e: any) {
      console.log(`  (1) Raw Key 실패:`, e.message);
    }

    // 방식 2: encoded serviceKey
    try {
      const u2 = `${ep.url}&serviceKey=${encodeURIComponent(RAW_KEY)}`;
      const res2 = await fetch(u2, { signal: AbortSignal.timeout(5000) });
      const text2 = await res2.text();
      console.log(`  (2) Encoded Key: 상태 ${res2.status} | 결과:`, text2.slice(0, 150));
    } catch (e: any) {
      console.log(`  (2) Encoded Key 실패:`, e.message);
    }
  }
}

testTago();
