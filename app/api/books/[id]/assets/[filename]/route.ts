import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string, filename: string }> }
) {
  try {
    const { id: bookIdStr, filename } = await params;
    const bookId = parseInt(bookIdStr, 10);

    if (isNaN(bookId)) {
      return new NextResponse('Invalid book ID', { status: 400 });
    }

    // VERY BASIC PATH TRAVERSAL PREVENTION
    if (filename.includes('/') || filename.includes('..')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const filePath = storage.getAssetPath(bookId, filename);
    const fileBuffer = await fs.readFile(filePath);

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.pdf') contentType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse('Not found', { status: 404 });
    }
    console.error('Failed to get asset:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
