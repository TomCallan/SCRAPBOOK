"use client";

import React from 'react';
import { Search, X, Loader2, Sparkles, ChevronRight } from 'lucide-react';

interface SearchModalProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  isSearching: boolean;
  setShowSearch: (show: boolean) => void;
  setActiveBookId: (id: number) => void;
}

export const SearchModal = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  setShowSearch,
  setActiveBookId
}: SearchModalProps) => {
  return (
    <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-start justify-center pt-16 md:pt-24 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] border border-stone-200/50">
        <div className="p-4 border-b border-stone-100 flex items-center gap-3 bg-stone-50/80 backdrop-blur">
          <Search size={22} className="text-stone-400" />
          <input 
            autoFocus 
            type="text" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search specifically or conceptually..." 
            className="flex-1 bg-transparent border-none outline-none text-xl font-medium text-stone-800 placeholder-stone-400" 
          />
          <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-stone-400 hover:text-stone-600 bg-stone-200/50 hover:bg-stone-200 rounded-full p-1.5 transition-colors"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto p-3 scrollbar-thin flex-1 bg-[#fcfaf7]">
          {isSearching ? (
            <div className="p-12 text-center text-stone-400 flex flex-col items-center gap-3 justify-center h-full">
              <Loader2 className="animate-spin text-stone-300" size={32} /> 
              <span className="text-xs font-bold uppercase tracking-widest">Searching Knowledge Base...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((res, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-white hover:bg-emerald-50/50 rounded-xl cursor-pointer border border-stone-100 hover:border-emerald-200 transition-all shadow-sm hover:shadow group"
                  onClick={() => {
                    setActiveBookId(res.bookId);
                    setShowSearch(false);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                      <span className="text-stone-800 bg-stone-100 px-2 py-0.5 rounded">{res.bookTitle}</span>
                      {res.type === 'concept' ? (
                        <span className="text-amber-600 flex items-center gap-1"><Sparkles size={10} /> CONCEPT MATCH</span>
                      ) : (
                        <span className="text-emerald-600">EXACT MATCH</span>
                      )}
                    </span>
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 text-stone-300 transform group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-stone-600 font-serif leading-relaxed line-clamp-2">"{res.text.replace(/\ng/, ' ')}"</p>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-12 text-center text-stone-400 h-full flex flex-col items-center justify-center">
              <p className="font-serif italic text-lg mb-2">No echoes found.</p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-50">Try different keywords</p>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 h-full flex flex-col items-center justify-center space-y-4">
              <Search size={48} className="text-stone-200" />
              <div>
                <h3 className="font-bold text-stone-700 mb-1">Global Knowledge Search</h3>
                <p className="text-sm">Type anything to instantly locate exact matches or conceptual ideas across all your scrapbooks.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
