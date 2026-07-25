import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Processes an uploaded image file, converts it to WebP, and saves it.
 * @param file The multer file object
 * @param subfolder The subfolder inside uploads (e.g., 'profiles', 'logos')
 * @param quality WebP compression quality (1-100)
 * @returns The public URL path to the saved image
 */
export async function processAndSaveImage(
  file: Express.Multer.File,
  subfolder: string = 'general',
  quality: number = 80
): Promise<string> {
  if (!file) return '';

  const uploadDir = path.join(process.cwd(), 'uploads', subfolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${uuidv4()}.webp`;
  const filePath = path.join(uploadDir, filename);

  await sharp(file.buffer)
    .webp({ quality })
    .toFile(filePath);

  return `/uploads/${subfolder}/${filename}`;
}
