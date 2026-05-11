/**
 * PWA 아이콘 생성 스크립트
 * 실행: node scripts/generate-icons.mjs
 *
 * 앱의 API 엔드포인트(/api/pwa-icon)에서 아이콘을 다운받아 public/icons/에 저장
 * Vercel 배포 후 한 번 실행하면 됨
 */

const sizes = [192, 512];
const baseUrl = process.argv[2] || 'https://dalsaegim.vercel.app';

async function generateIcons() {
  for (const size of sizes) {
    const url = `${baseUrl}/api/pwa-icon?size=${size}`;
    console.log(`Fetching ${size}x${size} icon from ${url}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const fs = await import('fs');
      const path = await import('path');
      const outPath = path.join('public', 'icons', `icon-${size}.png`);
      fs.writeFileSync(outPath, buffer);
      console.log(`  -> Saved ${outPath} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`  -> Failed: ${err.message}`);
    }
  }
  console.log('Done!');
}

generateIcons();
