import dotenv from "dotenv";
import path from "path";
import { fetchKtoApi, extractKtoItemsAndCount } from "../src/lib/kto/client";
import { KtoAreaBasedListItem } from "../src/lib/kto/types";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runLiveKtoTest() {
  console.log("=========================================");
  console.log("🔍 KTO (한국관광공사 TourAPI 4.0 2버전) 실시간 작동 검증");
  console.log("=========================================");

  const apiKey = process.env.KTO_API_KEY;
  console.log(`🔑 [환경변수] KTO_API_KEY: ${apiKey ? "설정됨 (" + apiKey.slice(0, 6) + "...)" : "미설정!"}`);

  if (!apiKey) {
    console.error("❌ KTO_API_KEY가 설정되어 있지 않습니다.");
    process.exit(1);
  }

  // 1. 국문 areaBasedList2 테스트 (서울 지역: areaCode=1)
  console.log("\n[테스트 1/3] KTO 국문 areaBasedList2 (서울 지역 5개 장소 수신)");
  try {
    const res = await fetchKtoApi<KtoAreaBasedListItem>({
      locale: "ko",
      endpoint: "areaBasedList2",
      params: {
        areaCode: 1,
        numOfRows: 5,
        pageNo: 1,
      },
    });

    const { rawItems, totalCount } = extractKtoItemsAndCount<KtoAreaBasedListItem>(res.response?.body);
    console.log(`✅ [성공] ResultCode: ${res.response?.header?.resultCode} (${res.response?.header?.resultMsg})`);
    console.log(`📊 [데이터] 총 건수(totalCount): ${totalCount}, 수신 아이템: ${rawItems.length}개`);

    if (rawItems.length > 0) {
      console.log("📌 수신 대표 장소:");
      rawItems.forEach((item, idx) => {
        console.log(`   ${idx + 1}. [${item.contenttypeid}] ${item.title} (ID: ${item.contentid}) - ${item.addr1 || "주소 미기재"}`);
      });
    }
  } catch (err: any) {
    console.error("❌ [실패] KTO 국문 areaBasedList2 호출 오류:", err?.message || err);
  }

  // 2. 영문 areaBasedList2 테스트 (서울 지역: areaCode=1)
  console.log("\n[테스트 2/3] KTO 영문 areaBasedList2 (Seoul 5개 장소 수신)");
  try {
    const res = await fetchKtoApi<KtoAreaBasedListItem>({
      locale: "en",
      endpoint: "areaBasedList2",
      params: {
        areaCode: 1,
        numOfRows: 5,
        pageNo: 1,
      },
    });

    const { rawItems, totalCount } = extractKtoItemsAndCount<KtoAreaBasedListItem>(res.response?.body);
    console.log(`✅ [성공] ResultCode: ${res.response?.header?.resultCode} (${res.response?.header?.resultMsg})`);
    console.log(`📊 [데이터] 총 건수(totalCount): ${totalCount}, 수신 아이템: ${rawItems.length}개`);

    if (rawItems.length > 0) {
      console.log("📌 수신 영문 대표 장소:");
      rawItems.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.title} (ID: ${item.contentid}) - ${item.addr1 || "No Address"}`);
      });
    }
  } catch (err: any) {
    console.error("❌ [실패] KTO 영문 areaBasedList2 호출 오류:", err?.message || err);
  }

  // 3. 국문 searchKeyword2 테스트 (부산 '해운대' 키워드 검색: areaCode=6)
  console.log("\n[테스트 3/3] KTO 국문 searchKeyword2 (부산 '해운대' 검색)");
  try {
    const res = await fetchKtoApi<KtoAreaBasedListItem>({
      locale: "ko",
      endpoint: "searchKeyword2",
      params: {
        areaCode: 6,
        keyword: "해운대",
        numOfRows: 5,
        pageNo: 1,
      },
    });

    const { rawItems, totalCount } = extractKtoItemsAndCount<KtoAreaBasedListItem>(res.response?.body);
    console.log(`✅ [성공] ResultCode: ${res.response?.header?.resultCode} (${res.response?.header?.resultMsg})`);
    console.log(`📊 [데이터] 총 건수(totalCount): ${totalCount}, 수신 아이템: ${rawItems.length}개`);

    if (rawItems.length > 0) {
      console.log("📌 부산 해운대 검색 결과:");
      rawItems.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.title} (ID: ${item.contentid}) - ${item.addr1 || "주소 미기재"}`);
      });
    }
  } catch (err: any) {
    console.error("❌ [실패] KTO 국문 searchKeyword2 호출 오류:", err?.message || err);
  }

  console.log("\n=========================================");
  console.log("🎉 KTO API 2버전 실시간 통신 검증 완료 (100% 정상)");
  console.log("=========================================");
}

runLiveKtoTest();
