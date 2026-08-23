import dotenv from "dotenv";
import path from "path";
import { fetchKtoApi, extractKtoItemsAndCount } from "../src/lib/kto/client";
import { KTO_ENDPOINTS, CITY_TO_KTO_AREA_CODE } from "../src/lib/kto/constants";
import { KtoAreaBasedListItem } from "../src/lib/kto/types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("=== KTO OpenAPI '후추네' 및 관악구/서울 검색 테스트 ===");
  const apiKey = process.env.KTO_API_KEY;
  console.log("KTO_API_KEY 설정 여부:", !!apiKey);

  // 1. '후추네' 검색
  try {
    const res = await fetchKtoApi<KtoAreaBasedListItem>({
      locale: "ko",
      endpoint: KTO_ENDPOINTS.SEARCH_KEYWORD,
      params: {
        keyword: "후추네",
        areaCode: CITY_TO_KTO_AREA_CODE["SEOUL"],
        numOfRows: 10,
        pageNo: 1,
      },
    });
    const parsed = extractKtoItemsAndCount<KtoAreaBasedListItem>(res.response?.body);
    console.log("1. '후추네' 검색 결과 수:", parsed.totalCount);
    console.log("결과 항목:", parsed.rawItems);
  } catch (err: any) {
    console.error("1. '후추네' 검색 에러:", err.message);
  }

  // 2. '봉천동' 음식점 또는 '샤로수길' 검색
  try {
    const res2 = await fetchKtoApi<KtoAreaBasedListItem>({
      locale: "ko",
      endpoint: KTO_ENDPOINTS.SEARCH_KEYWORD,
      params: {
        keyword: "샤로수길",
        areaCode: CITY_TO_KTO_AREA_CODE["SEOUL"],
        numOfRows: 5,
        pageNo: 1,
      },
    });
    const parsed2 = extractKtoItemsAndCount<KtoAreaBasedListItem>(res2.response?.body);
    console.log("\n2. '샤로수길' 검색 결과 수:", parsed2.totalCount);
    console.log("샤로수길 결과:", parsed2.rawItems?.map(r => ({ id: r.contentid, title: r.title, addr: r.addr1 })));
  } catch (err: any) {
    console.error("2. '샤로수길' 검색 에러:", err.message);
  }
}

main();
