import fs from "fs";
import path from "path";
import sharp from "sharp";

const src = path.resolve("public/icon.svg");
const outDir = path.resolve("public/icons");

const sizes = [192, 512];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generateIcons() {
  console.log("🔥 Generating Firelighter-CMS icons...");

  for (const size of sizes) {
    const baseName = `icon-${size}.png`;

    const colorFile = path.join(outDir, baseName);
    await sharp(src)
      .resize(size, size)
      .png()
      .toFile(colorFile);
    console.log(`✅ Color: ${baseName}`);

    const monoFile = path.join(outDir, `icon-${size}-mono.png`);
    await sharp(src)
      .resize(size, size)
      .png()
      .tint("#808080")
      .toFile(monoFile);
    console.log(`✅ Monochrome: icon-${size}-mono.png`);
  }

  const icoFile = path.join(outDir, "favicon.ico");
  await sharp(src)
    .resize(64, 64)
    .toFormat("ico")
    .toFile(icoFile);

  console.log("🌟 Done! All icons written to:", outDir);
}

generateIcons().catch(console.error);
