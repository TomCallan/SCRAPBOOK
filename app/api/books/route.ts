import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET() {
  try {
    const books = await storage.getBooks();
    return NextResponse.json(books);
  } catch (error) {
    console.error('Failed to get books:', error);
    return NextResponse.json({ error: 'Failed to read books' }, { status: 500 });
  }
}
