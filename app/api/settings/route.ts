import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import path from 'path';
import fs from 'fs/promises';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

async function getConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { dataDir: path.join(process.cwd(), 'data') };
  }
}

async function saveConfig(config: any) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const settings = await storage.getSettings();
    const config = await getConfig();
    return NextResponse.json({ ...(settings || {}), dataDir: config.dataDir });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dataDir, ...settings } = body;
    
    if (dataDir) {
      const config = await getConfig();
      await saveConfig({ ...config, dataDir });
    }
    
    await storage.saveSettings(settings);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
