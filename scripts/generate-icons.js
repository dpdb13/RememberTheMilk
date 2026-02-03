import sharp from 'sharp';

async function generateIcons() {
  const source = 'public/logo.png';

  const sizes = [
    { size: 192, name: 'public/icon-192.png' },
    { size: 512, name: 'public/icon-512.png' },
    { size: 180, name: 'public/apple-touch-icon.png' },
  ];

  for (const { size, name } of sizes) {
    await sharp(source)
      .resize(size, size)
      .png()
      .toFile(name);
    console.log(`Generado: ${name}`);
  }

  console.log('Iconos generados!');
}

generateIcons();
