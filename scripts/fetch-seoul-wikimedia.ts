import axios from "axios";
import fs from "fs";
import path from "path";

interface FoodTarget {
  id: string;
  foodNameKo: string;
  foodNameEn: string;
  currentNameInCatalog: string;
}

const SEOUL_FOODS: FoodTarget[] = [
  { id: "seoul_gwangjang_pancake", foodNameKo: "빈대떡", foodNameEn: "Bindaetteok", currentNameInCatalog: "광장시장 녹두빈대떡" },
  { id: "seoul_seolleongtang", foodNameKo: "설렁탕", foodNameEn: "Seolleongtang", currentNameInCatalog: "종로 설렁탕" },
  { id: "seoul_sindang_tteokbokki", foodNameKo: "즉석떡볶이", foodNameEn: "Tteokbokki", currentNameInCatalog: "신당동 즉석떡볶이" },
  { id: "seoul_mapo_galbi", foodNameKo: "돼지갈비", foodNameEn: "Dwaeji-galbi", currentNameInCatalog: "마포 돼지갈비" },
  { id: "seoul_dongdaemun_dakhanmari", foodNameKo: "닭한마리", foodNameEn: "Dakhanmari", currentNameInCatalog: "동대문 닭한마리" },
  { id: "seoul_namdaemun_galchijorim", foodNameKo: "갈치조림", foodNameEn: "Galchi-jorim", currentNameInCatalog: "남대문 갈치조림" },
  { id: "seoul_euljiro_golbaengi", foodNameKo: "골뱅이무침", foodNameEn: "Golbaengi-muchim", currentNameInCatalog: "을지로 골뱅이무침" },
  { id: "seoul_bukchon_sujebi", foodNameKo: "수제비", foodNameEn: "Sujebi", currentNameInCatalog: "삼청동 수제비" },
  { id: "seoul_itaewon_fusion", foodNameKo: "육회", foodNameEn: "Yukhoe", currentNameInCatalog: "광장시장 육회 & 육회비빔밥" },
  { id: "seoul_jangchung_jokbal", foodNameKo: "족발", foodNameEn: "Jokbal", currentNameInCatalog: "장충동 족발" },
];

async function searchCommons(query: string) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srnamespace=6&srlimit=8&format=json`;

  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "HypeHeritageBot/1.0 (https://hypeheritage.kr; contact@hypeheritage.kr)",
      },
      timeout: 10000,
    });
    return (res.data?.query?.search || []).map((s: any) => s.title);
  } catch (err: any) {
    console.error(`Search error for ${query}:`, err.message);
    return [];
  }
}

async function getFileInfo(titles: string[]) {
  if (titles.length === 0) return [];
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    titles.join("|")
  )}&prop=imageinfo&iiprop=url|extmetadata|dimensions&format=json`;

  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "HypeHeritageBot/1.0 (https://hypeheritage.kr; contact@hypeheritage.kr)",
      },
      timeout: 10000,
    });
    const pages = res.data?.query?.pages || {};
    return Object.values(pages).map((p: any) => {
      const info = p.imageinfo?.[0] || {};
      const meta = info.extmetadata || {};
      return {
        title: p.title,
        url: info.url,
        width: info.width,
        height: info.height,
        license: meta.LicenseShortName?.value || meta.License?.value || "Unknown",
        description: (meta.ImageDescription?.value || "").replace(/<[^>]*>?/gm, "").slice(0, 100),
      };
    }).filter((img: any) => img.url && !img.url.endsWith(".svg") && !img.url.endsWith(".tif") && !img.url.endsWith(".webp"));
  } catch (err: any) {
    console.error("FileInfo error:", err.message);
    return [];
  }
}

async function main() {
  const allResults: Record<string, any[]> = {};

  for (const item of SEOUL_FOODS) {
    console.log(`\n========================================`);
    console.log(`🔎 [검색] 음식명: "${item.foodNameKo}" (${item.foodNameEn})`);

    // 1. 순수 음식명(한글) 검색
    let titles = await searchCommons(item.foodNameKo);
    
    // 2. 만약 결과가 적으면 영문 단독 음식명으로 추가 검색
    if (titles.length < 3 && item.foodNameEn) {
      const enTitles = await searchCommons(item.foodNameEn);
      titles = Array.from(new Set([...titles, ...enTitles]));
    }

    // "즉석떡볶이"의 경우 결과가 적으면 "떡볶이" 단독 검색
    if (item.foodNameKo === "즉석떡볶이" && titles.length < 3) {
      const tbkTitles = await searchCommons("떡볶이");
      titles = Array.from(new Set([...titles, ...tbkTitles]));
    }

    const files = await getFileInfo(titles);
    allResults[item.id] = files;

    console.log(`✅ 결과 (${files.length}건):`);
    files.slice(0, 3).forEach((f: any, i: number) => {
      console.log(`  [${i + 1}] ${f.title}`);
      console.log(`      라이선스: ${f.license} (${f.width}x${f.height})`);
      console.log(`      URL: ${f.url}`);
    });
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), "scripts/seoul-wikimedia-candidates.json"),
    JSON.stringify(allResults, null, 2)
  );
  console.log("\n📁 'scripts/seoul-wikimedia-candidates.json' 저장 완료");
}

main();
