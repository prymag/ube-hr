export interface StorageProvider {
  upload(file: Express.Multer.File, path: string): Promise<string>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
}
