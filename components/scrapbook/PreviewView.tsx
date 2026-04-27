"use client";

import React, { useMemo } from 'react';
import { AnnotationOverlay } from './AnnotationOverlay';
import { Asset, Annotation } from '@/types/scrapbook';

interface PreviewViewProps {
  markdown: string;
  assets: Record<string, Asset>;
  annotations: Record<number, Annotation>;
  updateAnnotations: (pageIdx: number, newAnnotations: Partial<Annotation>) => void;
  activeTool: string;
  isExporting: boolean;
  includeMarkup: boolean;
  markedLoaded: boolean;
  previewRef: React.RefObject<HTMLDivElement>;
  toggleCheckbox: (index: number) => void;
}

export const PreviewView = ({
  markdown,
  assets,
  annotations,
  updateAnnotations,
  activeTool,
  isExporting,
  includeMarkup,
  markedLoaded,
  previewRef,
  toggleCheckbox
}: PreviewViewProps) => {
  const renderedPages = useMemo(() => {
    if (!markedLoaded || !(window as any).marked) return [];
    
    const renderer = new (window as any).marked.Renderer();
    let cbCount = 0;
    let hCount = 0;

    const processedMarkdown = markdown.replace(/^---+$/gm, '\n\n---\n\n');

    renderer.checkbox = (checkedArg: any) => {
      const isChecked = typeof checkedArg === 'object' ? checkedArg.checked : checkedArg;
      const idx = cbCount++;
      return `<input type="checkbox" data-checkbox-index="${idx}" ${isChecked ? 'checked' : ''} class="checkbox-sync" />`;
    };

    renderer.heading = (textArg: any, levelArg: any) => {
      const text = typeof textArg === 'object' ? textArg.text : textArg;
      const level = typeof textArg === 'object' ? textArg.depth : levelArg;
      const id = `heading-${hCount++}`;
      return `<h${level} id="${id}">${text}</h${level}>`;
    };

    const fullHtml = (window as any).marked.parse(processedMarkdown, { renderer });
    const segments = fullHtml.split(/<hr\s*\/?>/i);

    const pages: any[] = [];

    segments.forEach((segHtml: string) => {
      const regex = /(\[\[file:(.*?)\]\]|:::pdf file=(.*?):::)/g;
      let last = 0, match;
      let currentPageParts = [];

      while ((match = regex.exec(segHtml)) !== null) {
        const htmlBefore = segHtml.substring(last, match.index);
        if (htmlBefore.trim() || htmlBefore.includes('<')) {
          currentPageParts.push({ type: 'html', content: htmlBefore });
        }

        const fileName = match[2] || match[3];
        const asset = assets[fileName];

        if (asset && asset.type === 'pdf' && asset.pages) {
          if (currentPageParts.length > 0) {
            pages.push({ type: 'mixed', parts: currentPageParts });
            currentPageParts = [];
          }
          asset.pages.forEach((pUrl, idx) => {
            pages.push({ type: 'pdf-page', url: pUrl, assetName: asset.name, pageNum: idx + 1 });
          });
        } else {
          currentPageParts.push({ type: 'asset', fileName });
        }
        last = regex.lastIndex;
      }

      const htmlAfter = segHtml.substring(last);
      if (htmlAfter) {
        currentPageParts.push({ type: 'html', content: htmlAfter });
      }

      if (currentPageParts.length > 0) {
        pages.push({ type: 'mixed', parts: currentPageParts });
      } else if (!segHtml.includes(':::pdf')) {
        pages.push({ type: 'mixed', parts: [] });
      }
    });

    return pages;
  }, [markdown, assets, markedLoaded]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth bg-stone-200/50 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto pb-20 print:pb-0" ref={previewRef}>
        {renderedPages.map((pageData, pageIdx) => {
          if (pageData.type === 'pdf-page') {
            return (
              <div key={`page-${pageIdx}`} className={`scrapbook-page pdf-page-container relative bg-[#fcfaf7] overflow-hidden transition-all !w-full mx-auto ${isExporting ? 'p-0 my-0' : 'shadow-xl mb-12 border border-stone-200 rounded-sm'}`} style={{ maxWidth: '210mm', minHeight: '297mm', padding: 0, breakAfter: 'page', pageBreakAfter: 'always' }}>
                <img src={pageData.url} className="w-full h-full object-contain" alt={`${pageData.assetName} page ${pageData.pageNum}`} />
                <AnnotationOverlay pageIdx={pageIdx} annotations={annotations[pageIdx] || { strokes: [], notes: [] }} updateAnnotations={updateAnnotations} activeTool={activeTool} isExporting={isExporting} includeMarkup={includeMarkup} />
                <div className="absolute bottom-4 right-8 text-[10px] text-stone-300 font-bold tracking-widest print:text-stone-500 z-50 pointer-events-none">PAGE {pageIdx + 1}</div>
              </div>
            );
          }

          return (
            <div key={`page-${pageIdx}`} className={`scrapbook-page relative bg-[#fcfaf7] transition-all overflow-hidden !w-full mx-auto html2pdf-pagebreak ${isExporting ? 'p-[60px] my-0' : 'shadow-xl mb-12 border border-stone-200 rounded-sm p-8 md:p-[60px]'}`} style={{ maxWidth: '210mm', minHeight: '297mm', breakAfter: 'page', pageBreakAfter: 'always' }}>
              {!isExporting && <div className="absolute inset-0 opacity-[0.03] no-print pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}></div>}
              <AnnotationOverlay pageIdx={pageIdx} annotations={annotations[pageIdx] || { strokes: [], notes: [] }} updateAnnotations={updateAnnotations} activeTool={activeTool} isExporting={isExporting} includeMarkup={includeMarkup} />
              <div className="relative z-10 pointer-events-none">
                {pageData.parts.map((p: any, i: number) => {
                  if (p.type === 'html') {
                    return (
                      <div
                        key={i}
                        dangerouslySetInnerHTML={{ __html: p.content }}
                        onClick={(e: any) => {
                          if (e.target.tagName === 'INPUT') {
                            const idx = parseInt(e.target.getAttribute('data-checkbox-index'));
                            if (!isNaN(idx)) toggleCheckbox(idx);
                          }
                        }}
                        className="prose prose-stone max-w-none pointer-events-auto prose-headings:font-extrabold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl"
                      />
                    );
                  }

                  const asset = assets[p.fileName];
                  if (!asset) return <div key={i} className="text-red-500 font-mono text-xs my-4 p-2 bg-red-50 rounded">Missing asset: {p.fileName}</div>;

                  if (asset.type === 'image') {
                    return (
                      <div key={i} className="my-10 flex flex-col items-center">
                        <div className="bg-white p-3 shadow-2xl border border-stone-200 transform rotate-1 transition-transform max-w-full">
                          <img src={asset.data} className="max-h-[500px] object-contain" alt="" />
                          <div className="mt-4 text-center border-t border-stone-100 pt-3">
                            {asset.caption && <p className="font-serif italic text-stone-700">"{asset.caption}"</p>}
                            {(asset.date || asset.location) && (
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                                {asset.date} {asset.location && `• ${asset.location}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
              <div className="absolute bottom-4 right-8 text-[10px] text-stone-300 font-bold tracking-widest print:text-stone-500 pointer-events-none z-50">PAGE {pageIdx + 1}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
