
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'src', 'lib', 'sales.config.json');
        const fileContents = await fs.readFile(filePath, 'utf8');
        const config = JSON.parse(fileContents);
        return NextResponse.json(config);
    } catch (error) {
        console.error('Failed to read sales config:', error);
        return NextResponse.json({ error: 'Failed to read config file' }, { status: 500 });
    }
}
