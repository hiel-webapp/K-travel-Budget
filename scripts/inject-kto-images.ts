import fs from "fs";
import path from "path";

const catalogPath = path.resolve(process.cwd(), "src/features/budget/catalog/food-catalog.ts");
const imagesPath = path.resolve(process.cwd(), "scripts/food-kto-images.json");

const images: Record<string, string> = JSON.parse(fs.readFileSync(imagesPath, "utf-8"));
let catalogContent = fs.readFileSync(catalogPath, "utf-8");

let updatedCount = 0;

for (const [id, url] of Object.entries(images)) {
  // 이미 imageUrl이 있는 경우 교체
  const existingRegex = new RegExp(`(id:\\s*["']${id}["'][\\s\\S]*?imageUrl:\\s*["'])([^"']*)(["'])`);
  if (existingRegex.test(catalogContent)) {
    catalogContent = catalogContent.replace(existingRegex, `$1${url}$3`);
    updatedCount++;
    continue;
  }

  // imageUrl이 없는 경우 emoji 바로 아래에 추가
  const emojiRegex = new RegExp(`(id:\\s*["']${id}["'][\\s\\S]*?emoji:\\s*["'][^"']*["'],)`);
  if (emojiRegex.test(catalogContent)) {
    catalogContent = catalogContent.replace(emojiRegex, `$1\n    imageUrl: "${url}",`);
    updatedCount++;
    continue;
  }
}

fs.writeFileSync(catalogPath, catalogContent, "utf-8");
console.log(`🎉 food-catalog.ts에 총 ${updatedCount}개 항목 KTO 공식 이미지 URL 주입 완료!`);
