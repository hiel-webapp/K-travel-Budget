import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generateThumbnails() {
  const width = 248;
  const height = 93;

  // 글자를 최소화하고 핵심 브랜드와 정체성만 담은 미니멀 248x93 배너
  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- 모던 다크 블루/틸 그라데이션 -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#091424" />
        <stop offset="60%" stop-color="#0f2238" />
        <stop offset="100%" stop-color="#0d3138" />
      </linearGradient>

      <!-- 틸 하이라이트 원형 글로우 -->
      <radialGradient id="tealGlow" cx="90%" cy="15%" r="70%">
        <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.30" />
        <stop offset="100%" stop-color="#14b8a6" stop-opacity="0" />
      </radialGradient>

      <!-- 미니멀 로고 심볼 그라데이션 -->
      <linearGradient id="symbolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2dd4bf" />
        <stop offset="100%" stop-color="#0d9488" />
      </linearGradient>
    </defs>

    <!-- 배경 -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" rx="8" />
    <rect width="${width}" height="${height}" fill="url(#tealGlow)" rx="8" />

    <!-- 세련된 외곽 테두리 -->
    <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="7.5" fill="none" stroke="#334155" stroke-width="1" stroke-opacity="0.7" />

    <!-- 좌측 상단: 공공데이터 TourAPI 미니멀 뱃지 -->
    <g transform="translate(16, 14)">
      <rect width="66" height="15" rx="7.5" fill="#0d9488" fill-opacity="0.2" stroke="#14b8a6" stroke-width="0.7" stroke-opacity="0.6" />
      <text x="33" y="10.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif" font-size="7.5" font-weight="700" fill="#2dd4bf" text-anchor="middle" letter-spacing="0.3">
        TourAPI 4.0
      </text>
    </g>

    <!-- 중앙/좌측 메인 브랜드명: HypeHeritage -->
    <g transform="translate(16, 52)">
      <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif" font-size="21" font-weight="900" fill="#ffffff" letter-spacing="-0.6">
        HypeHeritage
      </text>
    </g>

    <!-- 하단 핵심 제품명: 한국 여행 맞춤 예산 플래너 -->
    <g transform="translate(16, 73)">
      <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif" font-size="10.5" font-weight="700" fill="#e2e8f0" letter-spacing="-0.3">
        한국 여행 맞춤 예산 플래너
      </text>
    </g>

    <!-- 우측 미니멀 심볼 그래픽 (한국 여행/예산 핀 모티브) -->
    <g transform="translate(${width - 32}, ${height / 2 + 2})">
      <!-- 외곽 서클 링 -->
      <circle r="18" fill="none" stroke="#334155" stroke-width="1" stroke-opacity="0.5" />
      <circle r="13" fill="none" stroke="#14b8a6" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="2 2" />
      <!-- 위치/나침반 모티브 핀 -->
      <path d="M0 -7 L5 5 L0 2 L-5 5 Z" fill="url(#symbolGrad)" opacity="0.9" />
      <circle cx="0" cy="1" r="1.5" fill="#ffffff" />
    </g>
  </svg>
  `;

  const outDir = path.resolve(__dirname, "../public/downloads");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(svg);

  // 1. 표준 규격 (248 x 93 px) PNG
  const thumbPath = path.join(outDir, "hypeheritage_thumbnail_248x93.png");
  const rootThumbPath = path.resolve(__dirname, "../hypeheritage_thumbnail_248x93.png");

  await sharp(svgBuffer)
    .resize(width, height)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(thumbPath);

  fs.copyFileSync(thumbPath, rootThumbPath);

  // 2. JPG 버전 (248 x 93 px)
  const jpgPath = path.join(outDir, "hypeheritage_thumbnail_248x93.jpg");
  const rootJpgPath = path.resolve(__dirname, "../hypeheritage_thumbnail_248x93.jpg");

  await sharp(svgBuffer)
    .resize(width, height)
    .flatten({ background: "#091424" })
    .jpeg({ quality: 95 })
    .toFile(jpgPath);

  fs.copyFileSync(jpgPath, rootJpgPath);

  // 3. 고해상도 규격 (496 x 186 px, 2배수 레티나)
  const thumb2xPath = path.join(outDir, "hypeheritage_thumbnail_496x186.png");
  const rootThumb2xPath = path.resolve(__dirname, "../hypeheritage_thumbnail_496x186.png");

  await sharp(svgBuffer)
    .resize(width * 2, height * 2)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(thumb2xPath);

  fs.copyFileSync(thumb2xPath, rootThumb2xPath);

  console.log("[SUCCESS] 최소 텍스트 미니멀 썸네일 재생성 완료:");
  console.log(`- 248x93 PNG: ${rootThumbPath}`);
  console.log(`- 248x93 JPG: ${rootJpgPath}`);
  console.log(`- 496x186 2x PNG: ${rootThumb2xPath}`);
}

generateThumbnails().catch(console.error);
