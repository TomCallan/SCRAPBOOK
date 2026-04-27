"use client";

import React from 'react';
import { X, Loader2, GripVertical, Trash2, UploadCloud } from 'lucide-react';
import { Asset } from '@/types/scrapbook';

interface AssetSidebarProps {
  assets: Record<string, Asset>;
  editingAsset: string | null;
  setEditingAsset: (name: string | null) => void;
  deleteAsset: (name: string) => void;
  updateAssetMetadata: (name: string, key: string, value: string) => void;
  isProcessingFiles: boolean;
  isDraggingOverLibrary: boolean;
  setIsDraggingOverLibrary: (dragging: boolean) => void;
  handleFiles: (files: FileList | File[], insertIntoEditor: boolean) => void;
  activeMobileTab: string;
  setActiveMobileTab: (tab: string) => void;
}

export const AssetSidebar = ({
  assets,
  editingAsset,
  setEditingAsset,
  deleteAsset,
  updateAssetMetadata,
  isProcessingFiles,
  isDraggingOverLibrary,
  setIsDraggingOverLibrary,
  handleFiles,
  activeMobileTab,
  setActiveMobileTab
}: AssetSidebarProps) => {
  return (
    <div 
      className={`w-80 border-l border-stone-200 bg-stone-50 flex flex-col shrink-0 relative transition-colors ${activeMobileTab === 'assets' ? 'fixed inset-0 z-40 bg-white' : 'hidden md:flex'} ${isDraggingOverLibrary ? 'bg-stone-100 ring-2 ring-inset ring-stone-300' : ''}`}
      onDragOver={(e) => {
        setIsDraggingOverLibrary(true);
        if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault();
        }
      }}
      onDragLeave={() => setIsDraggingOverLibrary(false)}
      onDrop={(e) => {
        setIsDraggingOverLibrary(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          e.preventDefault();
          handleFiles(e.dataTransfer.files, false);
        }
      }}
    >
      <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
        <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase flex items-center gap-2">
          Asset Library
          {isProcessingFiles && <span className="text-stone-400 flex items-center gap-1 lowercase"><Loader2 size={10} className="animate-spin" /> loading...</span>}
        </span>
        <button onClick={() => setActiveMobileTab('editor')} className="md:hidden p-2 text-stone-400"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar scrollbar-thin">
        {Object.values(assets).map((asset) => (
          <div
            key={asset.name}
            draggable
            onDragStart={(e) => {
              const tag = asset.type === 'pdf' ? `:::pdf file=${asset.name}:::` : `[[file:${asset.name}]]`;
              e.dataTransfer.setData("text/plain", tag);
            }}
            className={`p-3 bg-white border rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-stone-400 transition-all group ${editingAsset === asset.name ? 'ring-2 ring-stone-900' : ''}`}
            onClick={() => setEditingAsset(editingAsset === asset.name ? null : asset.name)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                <img src={asset.thumbnail} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black truncate text-stone-800">{asset.name}</p>
                <p className="text-[9px] text-stone-400 font-bold uppercase">{asset.type} • {asset.numPages || 1}p</p>
              </div>
              <GripVertical size={14} className="text-stone-300" />
              <button onClick={(e) => { e.stopPropagation(); deleteAsset(asset.name); }} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>

            {editingAsset === asset.name && (
              <div className="mt-3 pt-3 border-t border-stone-100 space-y-2 animate-in fade-in" onClick={e => e.stopPropagation()}>
                <input type="text" placeholder="Caption" value={asset.caption} onChange={e => updateAssetMetadata(asset.name, 'caption', e.target.value)} className="w-full p-2 text-[10px] border border-stone-200 rounded-md outline-none focus:ring-1 focus:ring-stone-400 transition-all" />
                <div className="flex gap-2">
                  <input type="text" placeholder="Date" value={asset.date} onChange={e => updateAssetMetadata(asset.name, 'date', e.target.value)} className="w-1/2 p-2 text-[10px] border border-stone-200 rounded-md outline-none focus:ring-1 focus:ring-stone-400 transition-all" />
                  <input type="text" placeholder="Location" value={asset.location} onChange={e => updateAssetMetadata(asset.name, 'location', e.target.value)} className="w-1/2 p-2 text-[10px] border border-stone-200 rounded-md outline-none focus:ring-1 focus:ring-stone-400 transition-all" />
                </div>
              </div>
            )}
          </div>
        ))}
        {Object.keys(assets).length === 0 && (
          <div className="text-center py-20 opacity-20 flex flex-col items-center border-2 border-dashed border-stone-300 rounded-2xl m-2">
            <UploadCloud size={40} className="mb-2" />
            <p className="text-[10px] font-black uppercase">Drop files here</p>
          </div>
        )}
      </div>
    </div>
  );
};
