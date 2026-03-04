/**
 * GET /api/admin/dependabot-prs
 *
 * Fetches open PRs authored by dependabot[bot] from the GitHub repo.
 * Uses GitHub API via GITHUB_TOKEN env var, falls back to unauthenticated.
 *
 * Related to: UNI-1389
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GitHubPR {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  head: { ref: string };
  mergeable: boolean | null;
  labels: { name: string; color: string }[];
}

const REPO = 'CleanExpo/Unite-Hub';

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${REPO}/pulls?state=open&per_page=30&sort=created&direction=desc`,
      { headers, next: { revalidate: 300 } }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[dependabot-prs] GitHub API error:', res.status, text);
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}` },
        { status: 502 }
      );
    }

    const allPrs: GitHubPR[] = await res.json();

    // Filter to dependabot PRs only
    const dependabotPrs = allPrs
      .filter(
        (pr) =>
          pr.title.startsWith('chore(deps)') ||
          pr.title.startsWith('chore(ci)') ||
          pr.head.ref.startsWith('dependabot/')
      )
      .map((pr) => ({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        branch: pr.head.ref,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergeable: pr.mergeable,
        labels: pr.labels.map((l) => ({ name: l.name, color: l.color })),
      }));

    return NextResponse.json({
      prs: dependabotPrs,
      total: dependabotPrs.length,
    });
  } catch (err) {
    console.error('[dependabot-prs]', err);
    return NextResponse.json(
      { error: 'Failed to fetch Dependabot PRs' },
      { status: 500 }
    );
  }
}
