import fs from 'fs-extra';
import path from 'path';
import { imageSize } from 'image-size';

export async function validateIcon(iconPath) {
  if (!await fs.pathExists(iconPath)) {
    throw new Error(`Icon file not found: ${iconPath}`);
  }
  const ext = path.extname(iconPath).toLowerCase();
  if (ext !== '.png') {
    throw new Error(`Icon must be a PNG file, got: ${ext}`);
  }
  const buffer = await fs.readFile(iconPath);
  const dimensions = imageSize(buffer);
  if (dimensions.width < 256 || dimensions.height < 256) {
    throw new Error(`Icon must be at least 256x256, got: ${dimensions.width}x${dimensions.height}`);
  }
}

export async function convertIcon(iconPath, outputDir, platform = process.platform) {
  if (platform === 'win32') {
    const pngToIco = (await import('png-to-ico')).default;
    const pngBuffer = await fs.readFile(iconPath);
    const icoBuffer = await pngToIco(pngBuffer);
    const icoPath = path.join(outputDir, 'icon.ico');
    await fs.writeFile(icoPath, icoBuffer);
    return icoPath;
  } else if (platform === 'darwin') {
    const png2icons = (await import('png2icons')).default;
    const pngBuffer = await fs.readFile(iconPath);
    const icnsBuffer = png2icons.createICNS(pngBuffer, png2icons.BILINEAR, 0);
    if (!icnsBuffer) throw new Error('Failed to convert PNG to ICNS');
    const icnsPath = path.join(outputDir, 'icon.icns');
    await fs.writeFile(icnsPath, icnsBuffer);
    return icnsPath;
  }
  return iconPath;
}
