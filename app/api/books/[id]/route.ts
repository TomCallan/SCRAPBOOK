import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id, 10);
    const book = await storage.getBook(id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({
      ...book.metadata,
      markdown: book.markdown
    });
  } catch (error) {
    console.error('Failed to get book:', error);
    return NextResponse.json({ error: 'Failed to read book' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id, 10);
    const body = await request.json();
    const { markdown, ...metadata } = body;
    
    await storage.saveBook(id, markdown, metadata);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update book:', error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseInt((await params).id, 10);
    await storage.deleteBook(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete book:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
