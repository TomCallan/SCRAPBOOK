"use client";

import React from 'react';
import { Plus, Book, Trash2 } from 'lucide-react';
import { Book as BookType } from '@/types/scrapbook';

interface BooksSidebarProps {
  books: BookType[];
  activeBookId: number;
  setActiveBookId: (id: number) => void;
  createNewBook: () => void;
  deleteBook: (id: number) => void;
  cycleColor: (id: number, color: string) => void;
}

export const BooksSidebar = ({
  books,
  activeBookId,
  setActiveBookId,
  createNewBook,
  deleteBook,
  cycleColor
}: BooksSidebarProps) => {
  return (
    <aside className="w-64 border-r border-stone-200 bg-[#f7f5f2] flex flex-col shrink-0 no-print animate-in slide-in-from-left duration-300">
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase">My Scrapbooks</span>
        <button 
          onClick={createNewBook}
          className="p-1 hover:bg-stone-200 rounded text-stone-600"
          title="New Scrapbook"
        >
          <Plus size={14} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {books.map(book => (
          <div key={book.id} className={`group flex items-center justify-between p-2 rounded-md transition-colors text-sm cursor-pointer ${activeBookId === book.id ? 'bg-white shadow-sm font-bold text-stone-900 border border-stone-200' : 'hover:bg-stone-200/50 text-stone-600'}`} onClick={() => setActiveBookId(book.id)}>
            <div className="flex items-center gap-2 truncate">
              <button 
                onClick={(e) => { e.stopPropagation(); cycleColor(book.id, book.color); }}
                className={`w-3 h-3 rounded-full shrink-0 ${book.color || 'bg-stone-300'} border border-black/10 hover:scale-110 transition-transform`}
              />
              <Book size={14} className={activeBookId === book.id ? "text-stone-800" : "text-stone-400"} />
              <span className="truncate">{book.title}</span>
            </div>
            {books.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBook(book.id);
                }} 
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};
