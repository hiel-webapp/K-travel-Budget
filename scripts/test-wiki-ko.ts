import axios from "axios";

async function testKorean() {
  const query = "빈대떡";
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json`;
  
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "HypeHeritageBot/1.0 (https://hypeheritage.kr; contact@hypeheritage.kr)",
      },
    });
    console.log("Korean Query Hits:", res.data?.query?.searchinfo?.totalhits);
    console.log("Top 3:", res.data?.query?.search?.slice(0, 3)?.map((s: any) => s.title));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

testKorean();
