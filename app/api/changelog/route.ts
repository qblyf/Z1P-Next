import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  version?: string;
  humanReadable: string;
}

export const dynamic = 'force-dynamic';

function getChangelogData(): CommitInfo[] {
  try {
    const filePath = join(process.cwd(), 'data', 'changelog.json');
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read changelog:', error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);

  const changelog = getChangelogData();
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedCommits = changelog.slice(start, end);

  return NextResponse.json({
    commits: paginatedCommits,
    total: changelog.length,
    page,
    limit,
    totalPages: Math.ceil(changelog.length / limit),
  });
}
