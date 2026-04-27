export interface Asset {
  name: string;
  type: 'image' | 'pdf';
  data: string;
  thumbnail: string;
  caption?: string;
  date?: string;
  location?: string;
  pages?: string[];
  numPages?: number;
}

export interface Annotation {
  strokes: any[];
  notes: any[];
}

export interface Book {
  id: number;
  title: string;
  color: string;
  markdown: string;
  assets: Record<string, Asset>;
  annotations: Record<number, Annotation>;
  chunks?: { text: string; embedding: number[] }[];
}

export interface Settings {
  aiProvider: string;
  aiModel: string;
  geminiApiKey: string;
  groqApiKey: string;
  enableVectorSearch: boolean;
  dataDir?: string;
}
