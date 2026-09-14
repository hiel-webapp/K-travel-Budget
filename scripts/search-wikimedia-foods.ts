import axios from "axios";

const FOODS = [
  { id: "seoul_gwangjang_pancake", nameKo: "빈대떡", englishTerm: "Bindaetteok" },
  { id: "seoul_seolleongtang", nameKo: "설렁탕", englishTerm: "Seolleongtang" },
  { id: "seoul_sindang_tteokbokki", nameKo: "즉석떡볶이", fallback: "떡볶이", englishTerm: "Tteokbokki" },
  { id: "seoul_mapo_galbi", nameKo: "돼지갈비", englishTerm: "Dwaeji galbi" },
  { id: "seoul_dongdaemun_dakhanmari", nameKo: "닭한마리", englishTerm: "Dakhanmari" },
  { id: "seoul_namdaemun_galchijorim", nameKo: "갈치조림", englishTerm: "Galchi-jorim" },
  { id: "seoul_euljiro_golbaengi", nameKo: "골뱅이무침", englishTerm: "Golbaengi-muchim" },
  { id: "seoul_bukchon_sujebi", nameKo: "수제비", englishTerm: "Sujebi" },
  { id: "seoul_itaewon_fusion", nameKo: "육회", englishTerm: "Yukhoe" },
  { id: "seoul_jangchung_jokbal", nameKo: "족발", englishTerm: "Jokbal" },
];

async function searchWikimedia(query: string) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata|dimensions&format=json`;

  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "HypeHeritageBot/1.0 (https://hypeheritage.kr; contact@hypeheritage.kr)",
      },
      timeout: 10000,
    });

    const pages = res.data?.query?.pages;
    if (!pages) return [];

    return Object.values(pages).map((p: any) => {
      const info = p.imageinfo?.[0] || {};
      const meta = info.extmetadata || {};
      return {
        title: p.title,
        url: info.url,
        thumbUrl: info.responsive?.["2x"] || info.url,
        width: info.width,
        height: info.height,
        license: meta.LicenseShortName?.value || meta.License?.value || "Unknown",
        description: (meta.ImageDescription?.value || "").replace(/<[^>]*>?/gm, "").slice(0, 150),
      };
    }).filter((img: any) => img.url && (img.url.endsWith(".jpg") || img.url.endsWith(".JPG") || img.url.endsWith(".jpeg") || img.url.endsWith(".png")));
  } catch (err: any) {
    console.error(`Search error for ${query}:`, err.message);
    return [];
  }
}

async function run() {
  console.log("=== Wikimedia Commons 음식명 전용 검색 ===");
  for (const item of FOODS) {
    console.log(`\n-----------------------------------------`);
    console.log(`[음식] ${item.nameKo} (${item.id})`);
    
    // 1. 한글 음식명으로 검색
    let results = await searchWikimedia(item.nameKo);
    console.log(`한글 검색 '${item.nameKo}': ${results.length}건 발견`);

    // 2. 검색 결과가 부족하거나 없으면 영문 표준 로마자 표기로 검색
    if (results.length < 2 && item.englishTerm) {
      const enResults = await searchWikimedia(item.englishTerm);
      console.log(`영문 검색 '${item.englishTerm}': ${enResults.length}건 발견`);
      results = [...results, ...enResults];
    }

    // fallback 검색 (예: 즉석떡볶이 -> 떡볶이)
    if (results.length === 0 && item.fallback) {
      const fbResults = await searchWikimedia(item.fallback);
      console.log(`대체 검색 '${item.fallback}': ${fbResults.length}건 발견`);
      results = [...results, ...fbResults];
    }

    results.slice(0, 4).forEach((r, idx) => {
      console.log(`  #${idx + 1}: ${r.title}`);
      console.log(`      라이선스: ${r.license}`);
      console.log(`      URL: ${r.url}`);
    });
  }
}

run();
