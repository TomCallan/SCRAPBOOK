"use client";

import React from 'react';
import { Book, Menu, Search, Settings, FileText, MousePointer2, PenTool, Highlighter, StickyNote, Loader2, Download } from 'lucide-react';

interface ScrapbookHeaderProps {
  showBooks: boolean;
  setShowBooks: (show: boolean) => void;
  showOutline: boolean;
  setShowOutline: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  activeBookTitle: string;
  setActiveBookTitle: (title: string) => void;
  mode: string;
  setMode: (mode: string) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  includeMarkup: boolean;
  setIncludeMarkup: (include: boolean) => void;
  isExporting: boolean;
  triggerPDFExport: () => void;
}

export const ScrapbookHeader = ({
  showBooks, setShowBooks,
  showOutline, setShowOutline,
  setShowSearch,
  setShowSettings,
  activeBookTitle, setActiveBookTitle,
  mode, setMode,
  activeTool, setActiveTool,
  includeMarkup, setIncludeMarkup,
  isExporting,
  triggerPDFExport
}: ScrapbookHeaderProps) => {
  return (
    <header className="h-14 bg-white border-b border-stone-200 px-4 flex items-center justify-between no-print shadow-sm shrink-0 z-50">
      <div className="flex items-center gap-3">
        <button title="Scrapbooks" onClick={() => setShowBooks(!showBooks)} className={`p-2 rounded-lg transition-colors ${showBooks ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100 text-stone-500'}`}>
          <Book size={20} />
        </button>
        <button title="Outline" onClick={() => setShowOutline(!showOutline)} className={`p-2 rounded-lg transition-colors ${showOutline ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100 text-stone-500'}`}>
          <Menu size={20} />
        </button>
        <button title="Search" onClick={() => setShowSearch(true)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
          <Search size={20} />
        </button>
        <button title="Settings" onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
          <Settings size={20} />
        </button>
        <div className="bg-stone-800 p-1.5 rounded-lg text-white ml-2">
          <FileText size={18} />
        </div>
        <input 
          type="text" 
          value={activeBookTitle} 
          onChange={(e) => setActiveBookTitle(e.target.value)}
          className="font-black text-xs md:text-base tracking-tight uppercase bg-transparent outline-none ring-0 w-48 focus:border-b-2 focus:border-stone-800"
        />
      </div>

      <div className="flex items-center gap-2">
        {mode === 'render' && (
          <div className="bg-stone-50 p-1 rounded-full flex mr-2 items-center gap-1 border border-stone-200 shadow-sm">
            <button 
              onClick={() => setActiveTool('none')} 
              className={`p-1.5 rounded-full transition-colors ${activeTool === 'none' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`} 
              title="Hand Focus"
            >
              <MousePointer2 size={14} />
            </button>
            <button 
              onClick={() => { setActiveTool('pen'); setIncludeMarkup(true); }} 
              className={`p-1.5 rounded-full transition-colors ${activeTool === 'pen' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`} 
              title="Pen Tool"
            >
              <PenTool size={14} />
            </button>
            <button 
              onClick={() => { setActiveTool('highlighter'); setIncludeMarkup(true); }} 
              className={`p-1.5 rounded-full transition-colors ${activeTool === 'highlighter' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`} 
              title="Highlighter Tool"
            >
              <Highlighter size={14} />
            </button>
            <button 
              onClick={() => { setActiveTool('sticky'); setIncludeMarkup(true); }} 
              className={`p-1.5 rounded-full transition-colors ${activeTool === 'sticky' ? 'bg-white shadow-sm text-stone-900 border border-stone-200' : 'text-stone-400 hover:text-stone-600'}`} 
              title="Sticky Note"
            >
              <StickyNote size={14} />
            </button>
            <div className="w-px h-4 bg-stone-200 mx-1"></div>
            <label className="flex items-center gap-1.5 text-[9px] font-black text-stone-500 uppercase tracking-widest px-2 cursor-pointer no-print mr-1">
              <input 
                type="checkbox" 
                checked={includeMarkup} 
                onChange={e => {
                  setIncludeMarkup(e.target.checked);
                  if (!e.target.checked && activeTool !== 'none') {
                    setActiveTool('none');
                  }
                }} 
                className="accent-stone-800" 
              />
              Markup
            </label>
          </div>
        )}
        <div className="bg-stone-100 p-1 rounded-full flex">
          <button onClick={() => setMode('edit')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'edit' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Edit</button>
          <button onClick={() => { setMode('render'); setActiveTool('none'); }} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'render' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Preview</button>
        </div>
        <button 
          disabled={isExporting} 
          onClick={triggerPDFExport} 
          className="bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
          {isExporting ? "Generating PDF..." : "Export"}
        </button>
      </div>
    </header>
  );
};
