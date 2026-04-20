import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local.storage.provider';
import { S3StorageProvider } from './s3.storage.provider';
import { StorageProvider } from './storage.provider';

@Injectable()
export class StorageService {
  private readonly provider: StorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly localProvider: LocalStorageProvider,
    private readonly s3Provider: S3StorageProvider,
  ) {
    this.provider =
      this.configService.get<string>('STORAGE_DRIVER') === 's3'
        ? this.s3Provider
        : this.localProvider;
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    return this.provider.upload(file, folder);
  }

  async delete(path: string): Promise<void> {
    return this.provider.delete(path);
  }

  getUrl(path: string): string {
    return this.provider.getUrl(path);
  }
}
