import dotenv from "dotenv";
import path from "path";
import axios from "axios";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testKtoFoodImage() {
  const apiKey = process.env.KTO_API_KEY;
  console.log("KTO_API_KEY:", apiKey ? apiKey.substring(0, 8) + "..." : "NONE");

  const testKeywords = ["닭한마리", "장충동 족발", "돼지국밥", "전주비빔밥", "초당순두부", "춘천닭갈비", "삼겹살"];

  for (const kw of testKeywords) {
    try {
      const url = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(apiKey || "")}&MobileOS=ETC&MobileApp=HypeHeritage&_type=json&keyword=${encodeURIComponent(kw)}&contentTypeId=39&numOfRows=3&pageNo=1`;
      const res = await axios.get(url, { timeout: 6000 });
      const items = res.data?.response?.body?.items?.item;
      if (items && items.length > 0) {
        const itemWithImg = items.find((i: any) => i.firstimage || i.firstimage2) || items[0];
        console.log(`✅ [${kw}] -> ${itemWithImg.title} | Img: ${itemWithImg.firstimage || itemWithImg.firstimage2 || "NO_IMAGE"}`);
      } else {
        // contentTypeId 없이 재검색
        const url2 = `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${encodeURIComponent(apiKey || "")}&MobileOS=ETC&MobileApp=HypeHeritage&_type=json&keyword=${encodeURIComponent(kw)}&numOfRows=3&pageNo=1`;
        const res2 = await axios.get(url2, { timeout: 6000 });
        const items2 = res2.data?.response?.body?.items?.item;
        const itemWithImg2 = items2?.find((i: any) => i.firstimage || i.firstimage2) || items2?.[0];
        console.log(`⚠️ [${kw}] (무제한 검색) -> ${itemWithImg2?.title || "없음"} | Img: ${itemWithImg2?.firstimage || itemWithImg2?.firstimage2 || "NO_IMAGE"}`);
      }
    } catch (e: any) {
      console.error(`❌ [${kw}] Error:`, e.message);
    }
  }
}

testKtoFoodImage();
