import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface AppConfig {
  dataDir?: string;
}

// Function to resolve the data directory dynamically
async function getDataDir(): Promise<string> {
  const configPath = path.join(process.cwd(), 'config.json');
  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    const config: AppConfig = JSON.parse(configData);
    if (config.dataDir) {
      return config.dataDir;
    }
  } catch (e: any) {
    // Ignore error if config.json doesn't exist or is invalid
  }
  return path.join(process.cwd(), 'data');
}

export interface BookMetadata {
  id: number;
  title: string;
  color: string;
  annotations: any;
  assets: any;
  chunks?: any[];
}

export interface StorageProvider {
  getSettings(): Promise<any>;
  saveSettings(settings: any): Promise<void>;
  
  getBooks(): Promise<any[]>;
  getBook(id: number): Promise<{ markdown: string; metadata: BookMetadata } | null>;
  saveBook(id: number, markdown: string, metadata: BookMetadata): Promise<void>;
  deleteBook(id: number): Promise<void>;

  saveAsset(bookId: number, filename: string, buffer: Buffer): Promise<string>;
  getAssetPath(bookId: number, filename: string): string;
}

class LocalStorageProvider implements StorageProvider {
  private async getDirs() {
    const dataDir = await getDataDir();
    return { dataDir };
  }

  private async getBookDir(id: number) {
    const { dataDir } = await this.getDirs();
    return path.join(dataDir, id.toString());
  }

  private async ensureBookDir(id: number) {
    const bookDir = await this.getBookDir(id);
    await fs.mkdir(bookDir, { recursive: true });
    await fs.mkdir(path.join(bookDir, 'assets'), { recursive: true });
  }

  async getSettings(): Promise<any> {
    const { dataDir } = await this.getDirs();
    await fs.mkdir(dataDir, { recursive: true });
    try {
      const data = await fs.readFile(path.join(dataDir, 'settings.json'), 'utf-8');
      return JSON.parse(data);
    } catch (e: any) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }

  async saveSettings(settings: any): Promise<void> {
    const { dataDir } = await this.getDirs();
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(path.join(dataDir, 'settings.json'), JSON.stringify(settings, null, 2), 'utf-8');
  }

  async getBooks(): Promise<any[]> {
    const { dataDir } = await this.getDirs();
    await fs.mkdir(dataDir, { recursive: true });
    try {
      const entries = await fs.readdir(dataDir, { withFileTypes: true });
      const books = [];
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const id = parseInt(entry.name, 10);
          if (!isNaN(id)) {
            const bookData = await this.getBook(id);
            if (bookData) {
              books.push({
                ...bookData.metadata,
                markdown: bookData.markdown
              });
            }
          }
        }
      }
      return books.sort((a, b) => a.id - b.id);
    } catch (e: any) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  }

  async getBook(id: number): Promise<{ markdown: string; metadata: BookMetadata } | null> {
    const bookDir = await this.getBookDir(id);
    try {
      const metadataRaw = await fs.readFile(path.join(bookDir, 'metadata.json'), 'utf-8');
      const markdown = await fs.readFile(path.join(bookDir, 'markdown.md'), 'utf-8');
      return {
        metadata: JSON.parse(metadataRaw),
        markdown
      };
    } catch (e: any) {
      if (e.code === 'ENOENT') return null;
      throw e;
    }
  }

  async saveBook(id: number, markdown: string, metadata: BookMetadata): Promise<void> {
    await this.ensureBookDir(id);
    const bookDir = await this.getBookDir(id);
    
    const cleanMetadata = { ...metadata };
    if (cleanMetadata.assets) {
      Object.keys(cleanMetadata.assets).forEach(key => {
        if (cleanMetadata.assets[key].pages) {
          cleanMetadata.assets[key].pages = []; // Strip pages
        }
      });
    }

    await fs.writeFile(path.join(bookDir, 'metadata.json'), JSON.stringify(cleanMetadata, null, 2), 'utf-8');
    await fs.writeFile(path.join(bookDir, 'markdown.md'), markdown, 'utf-8');
  }

  async deleteBook(id: number): Promise<void> {
    const bookDir = await this.getBookDir(id);
    try {
      await fs.rm(bookDir, { recursive: true, force: true });
    } catch(e) { /* ignore */ }
  }

  async saveAsset(bookId: number, filename: string, buffer: Buffer): Promise<string> {
    await this.ensureBookDir(bookId);
    const bookDir = await this.getBookDir(bookId);
    const assetsDir = path.join(bookDir, 'assets');
    
    // Use the original filename but make it safe
    const safeFilename = path.basename(filename).replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const filePath = path.join(assetsDir, safeFilename);
    
    await fs.writeFile(filePath, buffer);
    return safeFilename;
  }

  getAssetPath(bookId: number, filename: string): string {
    let dataDir = path.join(process.cwd(), 'data');
    try {
      const fsSync = require('fs');
      const configPath = path.join(process.cwd(), 'config.json');
      if (fsSync.existsSync(configPath)) {
        const configData = fsSync.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData);
        if (config.dataDir) dataDir = config.dataDir;
      }
    } catch { }
    return path.join(dataDir, bookId.toString(), 'assets', filename);
  }
}


// In the future, this could return an S3StorageProvider based on process.env.STORAGE_PROVIDER
export const storage: StorageProvider = new LocalStorageProvider();
