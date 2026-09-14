import axios from "axios";

async function testApi() {
  const query = "Bindaetteok";
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json`;
  
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "HypeHeritageBot/1.0 (https://hypeheritage.kr; contact@hypeheritage.kr)",
      },
    });
    console.log("Response:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

testApi();
