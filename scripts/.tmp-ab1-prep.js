const sharp = require('sharp');
const fs = require('fs');
(async () => {
  const buffer = await sharp(process.argv[2], { failOn: 'none' })
    .rotate()
    .rotate(Number(process.argv[4]) || 0)   // try 0, 90, 180, 270 until upright
    .trim({ threshold: 30 })
    .resize({ width: 2576, height: 2576, fit: 'inside', withoutEnlargement: true })
    .normalize()
    .jpeg({ quality: 90 })
    .toBuffer();
  fs.writeFileSync(process.argv[3], buffer);
})();
