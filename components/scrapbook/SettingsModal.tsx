"use client";

import React from 'react';
import { X } from 'lucide-react';
import { Settings } from '@/types/scrapbook';

interface SettingsModalProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  setShowSettings: (show: boolean) => void;
  saveSettings: (settings: Settings) => void;
}

export const SettingsModal = ({
  settings,
  setSettings,
  setShowSettings,
  saveSettings
}: SettingsModalProps) => {
  return (
    <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-stone-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg text-stone-900">App Settings</h2>
          <button onClick={() => setShowSettings(false)} className="text-stone-400 hover:text-stone-600 bg-stone-100 p-1 rounded-full"><X size={18} /></button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">AI Provider</label>
            <select 
              value={settings.aiProvider} 
              onChange={e => setSettings({...settings, aiProvider: e.target.value})} 
              className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50"
            >
              <option value="none">None</option>
              <option value="local">Local (Ollama)</option>
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          {settings.aiProvider !== 'none' && (
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Model Name</label>
              <input 
                type="text" 
                value={settings.aiModel} 
                onChange={e => setSettings({...settings, aiModel: e.target.value})} 
                placeholder="e.g. llama3-8b-8192 or gemini-2.5-flash-preview-09-2025" 
                className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50" 
              />
            </div>
          )}

          {settings.aiProvider === 'gemini' && (
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Gemini API Key</label>
              <input 
                type="password" 
                value={settings.geminiApiKey} 
                onChange={e => setSettings({...settings, geminiApiKey: e.target.value})} 
                placeholder="Paste Gemini AI key here..." 
                className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50" 
              />
              <p className="text-xs text-stone-400 mt-2 font-medium">Required for Magic Polish, Smart Import, and Concept Vector Search.</p>
            </div>
          )}

          {settings.aiProvider === 'groq' && (
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Groq API Key</label>
              <input 
                type="password" 
                value={settings.groqApiKey} 
                onChange={e => setSettings({...settings, groqApiKey: e.target.value})} 
                placeholder="Paste Groq API key here..." 
                className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50" 
              />
              <p className="text-xs text-stone-400 mt-2 font-medium">Required for Magic Polish and Smart Import. Embeddings will use local engine.</p>
            </div>
          )}
          <div className="border-t border-stone-100 pt-4">
            <label className="flex items-center gap-3 text-sm font-bold text-stone-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.enableVectorSearch} 
                onChange={e => setSettings({...settings, enableVectorSearch: e.target.checked})} 
                className="w-5 h-5 accent-stone-800 rounded border-stone-300" 
              />
              Enable Concept Vector Search
            </label>
            <p className="text-[11px] text-stone-400 mt-2 ml-8 leading-relaxed">
              When enabled, paragraphs are automatically indexed in the background to allow semantic meaning-based search instead of just exact text matches.
            </p>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Data Directory</label>
            <input 
              type="text" 
              value={settings.dataDir || ''} 
              onChange={e => setSettings({...settings, dataDir: e.target.value})} 
              placeholder="e.g. C:/my-data" 
              className="w-full p-2.5 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400 text-sm shadow-inner bg-stone-50" 
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button 
              onClick={() => saveSettings(settings)}
              className="px-4 py-2 bg-stone-900 text-white rounded-lg font-bold text-sm hover:bg-stone-800 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
