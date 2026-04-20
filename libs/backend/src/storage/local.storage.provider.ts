import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage.provider';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>('STORAGE_LOCAL_DIR') || 'uploads';
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const fullDir = path.join(this.uploadDir, folder);
    await fs.mkdir(fullDir, { recursive: true });

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(fullDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return `/uploads/${folder}/${fileName}`;
  }

  async delete(filePath: string): Promise<void> {
    const absolutePath = path.join(
      process.cwd(),
      filePath.replace('/uploads/', ''),
    );
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  getUrl(filePath: string): string {
    const baseUrl =
      this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
    return `${baseUrl}${filePath}`;
  }
}
