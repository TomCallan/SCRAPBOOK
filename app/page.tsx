"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { Edit3, Layers } from 'lucide-react';

import { useScrapbook } from '@/lib/hooks/use-scrapbook';
import { ScrapbookHeader } from '@/components/scrapbook/ScrapbookHeader';
import { BooksSidebar } from '@/components/scrapbook/BooksSidebar';
import { OutlineSidebar } from '@/components/scrapbook/OutlineSidebar';
import { AssetSidebar } from '@/components/scrapbook/AssetSidebar';
import { EditorView } from '@/components/scrapbook/EditorView';
import { PreviewView } from '@/components/scrapbook/PreviewView';
import { SettingsModal } from '@/components/scrapbook/SettingsModal';
import { SearchModal } from '@/components/scrapbook/SearchModal';

const App = () => {
  const s = useScrapbook();
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const outline = useMemo(() => {
    const lines = s.activeBook.markdown.split('\n');
    const items: any[] = [];
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        items.push({
          level: match[1].length,
          text: match[2],
          id: `heading-${items.length}`,
          lineIndex: index
        });
      }
    });
    return items;
  }, [s.activeBook.markdown]);

  const jumpToLine = (line: number) => {
    const outlineIndex = outline.findIndex(h => h.lineIndex === line);
    const el = document.getElementById(`heading-${outlineIndex}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });

    // Note: Textarea focus/offset handled if needed, but for now simple jump
  };

  const triggerPDFExport = async () => {
    s.setMode('render');
    s.setIsExporting(true);

    setTimeout(async () => {
      try {
        const container = previewRef.current;
        if (!container) throw new Error('Preview not ready');

        const pages = container.querySelectorAll('.scrapbook-page');
        if (pages.length === 0) throw new Error('No pages to export');

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = 210;
        const pageHeight = 297;

        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i] as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const imgH = (canvas.height * pageWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgH, pageHeight));
        }

        pdf.save(`${s.activeBook?.title || 'exported'}.pdf`);
      } catch (err) {
        console.error('PDF export failed:', err);
        alert('PDF export failed. Please try again.');
      } finally {
        s.setIsExporting(false);
      }
    }, 800);
  };

  const toggleCheckbox = (index: number) => {
    let count = 0;
    const newMarkdown = s.activeBook.markdown.replace(/^(\s*-\s\[)([ xX])(\]\s)/gm, (match, p1, char, p3) => {
      if (count++ === index) return p1 + (char.toLowerCase() === 'x' ? ' ' : 'x') + p3;
      return match;
    });
    s.setMarkdown(newMarkdown);
  };

  useEffect(() => {
    const preventFileDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };
    window.addEventListener('dragover', preventFileDrop);
    window.addEventListener('drop', preventFileDrop);
    return () => {
      window.removeEventListener('dragover', preventFileDrop);
      window.removeEventListener('drop', preventFileDrop);
    };
  }, []);

  return (
    <div className="h-screen bg-stone-50 text-stone-900 font-sans flex flex-col overflow-hidden">
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={(e) => e.target.files && s.handleFiles(e.target.files, true, (text) => {
          // Internal insertAtCursor logic is in EditorView, but hook needs a way to talk to it
          // For simplicity, we just append or use a global state if we really needed it.
          // In the current split, handleFiles just updates assets. The text insertion
          // is usually done by the drop handler in EditorView.
        })} 
        className="hidden" 
        accept="image/*,application/pdf,.pdf" 
      />

      <ScrapbookHeader 
        showBooks={s.showBooks} setShowBooks={s.setShowBooks}
        showOutline={s.showOutline} setShowOutline={s.setShowOutline}
        setShowSearch={s.setShowSearch}
        setShowSettings={s.setShowSettings}
        activeBookTitle={s.activeBook.title}
        setActiveBookTitle={(title) => s.setBooks(prev => prev.map(b => b.id === s.activeBookId ? { ...b, title } : b))}
        mode={s.mode} setMode={s.setMode}
        activeTool={s.activeTool} setActiveTool={s.setActiveTool}
        includeMarkup={s.includeMarkup} setIncludeMarkup={s.setIncludeMarkup}
        isExporting={s.isExporting}
        triggerPDFExport={triggerPDFExport}
      />

      <div className="flex flex-1 overflow-hidden">
        {s.showBooks && (
          <BooksSidebar 
            books={s.books}
            activeBookId={s.activeBookId}
            setActiveBookId={s.setActiveBookId}
            createNewBook={s.createNewBook}
            deleteBook={s.deleteBook}
            cycleColor={s.cycleColor}
          />
        )}

        {s.showOutline && (
          <OutlineSidebar 
            outline={outline}
            jumpToLine={jumpToLine}
            setShowOutline={s.setShowOutline}
          />
        )}

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {s.mode === 'edit' ? (
            <div className="flex flex-1 overflow-hidden">
              <EditorView 
                markdown={s.activeBook.markdown}
                setMarkdown={s.setMarkdown}
                cursorPos={s.cursorPos}
                setCursorPos={s.setCursorPos}
                isDraggingOverEditor={s.isDraggingOverEditor}
                setIsDraggingOverEditor={s.setIsDraggingOverEditor}
                handleFiles={(files) => s.handleFiles(files, true, (text) => {
                   // This part is handled internally in EditorView now
                })}
                improveWriting={s.improveWriting}
                isAILoading={s.isAILoading}
                activeMobileTab={s.activeMobileTab}
                fileInputRef={fileInputRef}
              />

              <AssetSidebar 
                assets={s.activeBook.assets}
                editingAsset={s.editingAsset}
                setEditingAsset={s.setEditingAsset}
                deleteAsset={s.deleteAsset}
                updateAssetMetadata={s.updateAssetMetadata}
                isProcessingFiles={s.isProcessingFiles}
                isDraggingOverLibrary={s.isDraggingOverLibrary}
                setIsDraggingOverLibrary={s.setIsDraggingOverLibrary}
                handleFiles={(files, insert) => s.handleFiles(files, insert, () => {})}
                activeMobileTab={s.activeMobileTab}
                setActiveMobileTab={s.setActiveMobileTab}
              />
            </div>
          ) : (
            <PreviewView 
              markdown={s.activeBook.markdown}
              assets={s.activeBook.assets}
              annotations={s.activeBook.annotations || {}}
              updateAnnotations={s.updateAnnotations}
              activeTool={s.activeTool}
              isExporting={s.isExporting}
              includeMarkup={s.includeMarkup}
              markedLoaded={s.markedLoaded}
              previewRef={previewRef}
              toggleCheckbox={toggleCheckbox}
            />
          )}
        </main>
      </div>

      <nav className="md:hidden h-16 bg-white border-t border-stone-200 grid grid-cols-2 no-print shrink-0 z-50">
        <button onClick={() => s.setActiveMobileTab('editor')} className={`flex flex-col items-center justify-center gap-1 ${s.activeMobileTab === 'editor' ? 'text-stone-900 font-bold' : 'text-stone-400'}`}>
          <Edit3 size={20} />
          <span className="text-[10px] uppercase">Editor</span>
        </button>
        <button onClick={() => s.setActiveMobileTab('assets')} className={`flex flex-col items-center justify-center gap-1 ${s.activeMobileTab === 'assets' ? 'text-stone-900 font-bold' : 'text-stone-400'}`}>
          <Layers size={20} />
          <span className="text-[10px] uppercase tracking-wider">Library</span>
        </button>
      </nav>

      {s.showSettings && (
        <SettingsModal 
          settings={s.settings}
          setSettings={s.setSettings}
          setShowSettings={s.setShowSettings}
          saveSettings={s.saveSettings}
        />
      )}

      {s.showSearch && (
        <SearchModal 
          searchQuery={s.searchQuery}
          setSearchQuery={s.setSearchQuery}
          searchResults={s.searchResults}
          isSearching={s.isSearching}
          setShowSearch={s.setShowSearch}
          setActiveBookId={s.setActiveBookId}
        />
      )}

      <style>{`
        .prose h1 { @apply text-3xl md:text-5xl font-serif font-black mb-8 pb-4 border-b-4 border-stone-800; }
        .prose h2 { @apply text-xl md:text-2xl font-serif font-bold mt-12 mb-6 text-stone-700; }
        .prose h3 { @apply text-lg md:text-xl font-serif font-semibold mt-8 mb-4 text-stone-600; }
        .prose p { @apply text-sm md:text-base leading-relaxed mb-6 text-stone-600 font-light; }
        .prose ul { @apply space-y-2 mb-6 list-disc pl-6; }
        .prose li { @apply relative text-sm md:text-base; }
        .prose strong { @apply font-bold text-stone-900; }
        .prose em { @apply italic; }
        
        .prose input[type="checkbox"] { 
          @apply w-5 h-5 rounded border-stone-300 accent-stone-800 cursor-pointer transition-all;
          appearance: auto;
          margin-right: 0.5rem;
          vertical-align: middle;
        }
        .prose li:has(input[type="checkbox"]) { @apply list-none pl-0; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          html, body, div.h-screen, main, .flex, .flex-1, .flex-col, .overflow-hidden, .overflow-y-auto { 
            height: auto !important; 
            overflow: visible !important; 
            display: block !important;
          }
          .scrapbook-page { 
            box-shadow: none !important; border: none !important; margin: 0 !important; 
            padding: 2.5cm !important; page-break-after: always; width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            background: white !important;
          }
          .scrapbook-page.pdf-page-container {
            padding: 0 !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;
