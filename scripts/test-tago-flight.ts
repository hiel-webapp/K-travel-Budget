import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const TAGO_API_KEY = process.env.TAGO_API_KEY || "";

async function testEndpoints() {
  const endpoints = [
    // 1. TAGO 국내항공운항정보 (국토교통부)
    {
      name: "TAGO DmstcFlightNvgInfoService (HTTP - raw key)",
      url: `http://apis.data.go.kr/1613000/DmstcFlightNvgInfoService/getArprtList?serviceKey=${TAGO_API_KEY}&_type=json`,
    },
    {
      name: "TAGO DmstcFlightNvgInfoService (HTTPS - raw key)",
      url: `https://apis.data.go.kr/1613000/DmstcFlightNvgInfoService/getArprtList?serviceKey=${TAGO_API_KEY}&_type=json`,
    },
    // 2. 한국공항공사 국내선 운항스케줄
    {
      name: "한국공항공사 FlightStatusList (HTTP - raw key)",
      url: `http://openapi.airport.co.kr/service/rest/FlightStatusList/getFlightStatusList?serviceKey=${TAGO_API_KEY}&_type=json`,
    },
    // 3. 한국공항공사 공항별 운항스케줄 (AirportFlightScheduleService)
    {
      name: "한국공항공사 AirportFlightScheduleService (HTTP - raw key)",
      url: `http://apis.data.go.kr/B551177/StatusOfPassengerFlights/getPassengerArrivals?serviceKey=${TAGO_API_KEY}&type=json`,
    },
  ];

  for (const ep of endpoints) {
    console.log(`\n--------------------------------------------`);
    console.log(`테스트: ${ep.name}`);
    try {
      const res = await fetch(ep.url);
      const text = await res.text();
      console.log(`응답 상태: ${res.status}`);
      console.log(`응답 내용: ${text.slice(0, 300)}`);
    } catch (e: any) {
      console.log(`에러: ${e.message}`);
    }
  }
}

testEndpoints();
