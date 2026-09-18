import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generateThumbnails() {
  const width = 248;
  const height = 93;

  // 248 x 93 SVG 템플릿
  // 심미성 높은 모던 다크 틸 그라데이션 + HypeHeritage 브랜딩 + 한국관광공사 연동 뱃지
  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- 배경 그라데이션 -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#132338" />
        <stop offset="100%" stop-color="#09353b" />
      </linearGradient>

      <!-- 골드 텍스트 그라데이션 -->
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#fbbf24" />
      </linearGradient>

      <!-- 틸 하이라이트 글로우 -->
      <radialGradient id="glow" cx="85%" cy="20%" r="60%">
        <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#14b8a6" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 배경 사각형 -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" rx="8" />
    <rect width="${width}" height="${height}" fill="url(#glow)" rx="8" />

    <!-- 테두리 라인 -->
    <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="7.5" fill="none" stroke="#334155" stroke-width="1" stroke-opacity="0.8" />

    <!-- 좌측 상단 브랜드 태그 뱃지 -->
    <g transform="translate(14, 13)">
      <rect width="90" height="15" rx="7.5" fill="#0d9488" fill-opacity="0.25" stroke="#14b8a6" stroke-width="0.8" stroke-opacity="0.6" />
      <text x="45" y="10.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif" font-size="7.5" font-weight="800" fill="#2dd4bf" text-anchor="middle" letter-spacing="0.5">
        TourAPI 4.0 공공데이터
      </text>
    </g>

    <!-- 우측 상단 국가대표 K-Travel 마크 -->
    <g transform="translate(${width - 48}, 13)">
      <rect width="34" height="15" rx="7.5" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-width="0.6" stroke-opacity="0.3" />
      <text x="17" y="10.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif" font-size="7.5" font-weight="700" fill="#e2e8f0" text-anchor="middle">
        K-Travel
      </text>
    </g>

    <!-- 메인 로고 영문 타이틀 -->
    <g transform="translate(14, 48)">
      <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif" font-size="18" font-weight="900" fill="#ffffff" letter-spacing="-0.5">
        HypeHeritage
      </text>
    </g>

    <!-- 서브 카피 (한국어 및 주요 기능) -->
    <g transform="translate(14, 66)">
      <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif" font-size="9.5" font-weight="800" fill="url(#goldGrad)" letter-spacing="-0.2">
        한국 여행 맞춤 예산 플래너
      </text>
    </g>

    <!-- 하단 설명/슬로건 -->
    <g transform="translate(14, 80)">
      <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Pretendard', sans-serif" font-size="7.5" font-weight="500" fill="#94a3b8" letter-spacing="-0.1">
        인공지능 일정 자동 설계 · 실시간 스마트 영수증 리포트
      </text>
    </g>

    <!-- 우측 장식 원형 그래픽 (한국의 삼태극/방위 느낌 모티브 미니멀 그래픽) -->
    <g transform="translate(${width - 28}, ${height / 2 + 10})">
      <circle r="16" fill="none" stroke="#14b8a6" stroke-width="1.2" stroke-opacity="0.3" stroke-dasharray="3 2" />
      <circle r="11" fill="none" stroke="#f59e0b" stroke-width="1" stroke-opacity="0.35" />
      <circle r="4" fill="#2dd4bf" fill-opacity="0.7" />
    </g>
  </svg>
  `;

  const outDir = path.resolve(__dirname, "../public/downloads");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const svgBuffer = Buffer.from(svg);

  // 1. 표준 규격 (248 x 93 px)
  const thumbPath = path.join(outDir, "hypeheritage_thumbnail_248x93.png");
  const rootThumbPath = path.resolve(__dirname, "../hypeheritage_thumbnail_248x93.png");

  await sharp(svgBuffer)
    .resize(width, height)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(thumbPath);

  fs.copyFileSync(thumbPath, rootThumbPath);

  // 2. 고해상도 규격 (496 x 186 px - 레티나 2배수, 혹시 고해상도를 요구할 경우 대비)
  const thumb2xPath = path.join(outDir, "hypeheritage_thumbnail_496x186.png");
  const rootThumb2xPath = path.resolve(__dirname, "../hypeheritage_thumbnail_496x186.png");

  await sharp(svgBuffer)
    .resize(width * 2, height * 2)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(thumb2xPath);

  fs.copyFileSync(thumb2xPath, rootThumb2xPath);

  // 3. JPG 버전도 함께 생성 (일부 심사 사이트에서 JPG만 허용하는 경우 대비)
  const jpgPath = path.join(outDir, "hypeheritage_thumbnail_248x93.jpg");
  const rootJpgPath = path.resolve(__dirname, "../hypeheritage_thumbnail_248x93.jpg");

  await sharp(svgBuffer)
    .resize(width, height)
    .flatten({ background: "#0f172a" })
    .jpeg({ quality: 95 })
    .toFile(jpgPath);

  fs.copyFileSync(jpgPath, rootJpgPath);

  console.log("[SUCCESS] 썸네일 이미지 생성 완료:");
  console.log(`- 248x93 PNG: ${rootThumbPath}`);
  console.log(`- 248x93 JPG: ${rootJpgPath}`);
  console.log(`- 496x186 2x PNG: ${rootThumb2xPath}`);
}

generateThumbnails().catch(console.error);
