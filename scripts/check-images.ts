import axios from 'axios';
import { VERIFIED_SEOUL_LANDMARKS } from './sync-kto-places';

async function testAllImages() {
  console.log('🔍 [Image Check] 20개 서울 랜드마크 이미지 유효성 전수 검사...\n');
  for (let i = 0; i < VERIFIED_SEOUL_LANDMARKS.length; i++) {
    const item = VERIFIED_SEOUL_LANDMARKS[i];
    try {
      const res = await axios.get(item.image_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://korean.visitkorea.or.kr/',
        },
        timeout: 6000,
        responseType: 'arraybuffer',
        validateStatus: () => true,
      });

      const contentType = String(res.headers['content-type'] || 'unknown');
      const contentLength = res.data?.length || 0;
      const isOk = res.status === 200 && contentLength > 5000 && contentType.startsWith('image/');

      console.log(
        `[${String(i + 1).padStart(2, '0')}/20] HTTP ${res.status} | Size: ${(contentLength / 1024).toFixed(1)}KB | Type: ${contentType} | ${isOk ? '✅ 정상' : '❌ 오류'} | ${item.title_en}`
      );
      if (!isOk) {
        console.log(`     ⚠️ URL: ${item.image_url}`);
      }
    } catch (err: any) {
      console.log(
        `[${String(i + 1).padStart(2, '0')}/20] ❌ FAIL ${err.message} | ${item.title_en}`
      );
      console.log(`     ⚠️ URL: ${item.image_url}`);
    }
  }
}

testAllImages();
