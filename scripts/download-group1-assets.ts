import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function downloadAndOptimize(name: string, url: string, targetFileName: string) {
  const targetDir = path.resolve(process.cwd(), 'public', 'assets');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const finalPath = path.join(targetDir, targetFileName);
  console.log(`\n📥 [${name}] 다운로드 시작: ${url}`);

  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'HypeHeritageBot/1.0 (https://hypeheritage.kr; contact@hypeheritage.kr)',
    },
    responseType: 'arraybuffer',
  });

  console.log(`  원본 다운로드 완료 (크기: ${Math.round(res.data.length / 1024)} KB)`);

  // Sharp 최적화: 가로 최대 1920px, JPEG quality 85
  await sharp(res.data)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .toFile(finalPath);

  const stat = fs.statSync(finalPath);
  console.log(`  ✅ 최적화 저장 완료: ${finalPath} (용량: ${Math.round(stat.size / 1024)} KB)`);
}

async function main() {
  console.log('=== [그룹 1: 궁궐 & 역사 에셋 다운로드 및 최적화] ===');

  // 1. 창덕궁 인정전
  await downloadAndOptimize(
    '창덕궁 인정전',
    'https://upload.wikimedia.org/wikipedia/commons/5/59/Injeongjeon_Hall_01.jpg',
    'changdeokgung-hall.jpg'
  );

  // 2. 종묘 정전
  await downloadAndOptimize(
    '종묘 정전',
    'https://upload.wikimedia.org/wikipedia/commons/b/ba/Jeongjeon%2C_Jongmyo_%28Spring%2C_2013%29.jpg',
    'jongmyo-main.jpg'
  );

  // 3. 남산골한옥마을 (사용자 선택 사진)
  await downloadAndOptimize(
    '남산골한옥마을',
    'https://upload.wikimedia.org/wikipedia/commons/4/4f/Korea_Namsan_Hanok_06.jpg',
    'namsangol-hanok.jpg'
  );

  console.log('\n🎉 모든 그룹 1 에셋 다운로드 및 최적화 완료!');
}

main().catch(err => {
  console.error('에러 발생:', err.message);
  process.exit(1);
});
