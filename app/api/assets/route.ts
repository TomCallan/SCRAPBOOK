import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bookIdStr = formData.get('bookId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bookId = parseInt(bookIdStr, 10);
    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'No valid bookId provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const savedFilename = await storage.saveAsset(bookId, file.name, buffer);
    
    return NextResponse.json({ 
      success: true, 
      url: `/api/books/${bookId}/assets/${savedFilename}` 
    });
  } catch (error) {
    console.error('Failed to save asset:', error);
    return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
  }
}

