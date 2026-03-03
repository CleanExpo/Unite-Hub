import { NextResponse } from 'next/server';

interface LinearIssueNode {
  id: string;
  identifier: string;
  title: string;
  priority: number;
  state: {
    type: string;
    name: string;
  };
}

interface KanbanItem {
  id: string;
  title: string;
  column: 'hot' | 'today' | 'pipeline';
  business: string;
  priority: number;
}

const STATIC_ITEMS: KanbanItem[] = [
  { id: '1', title: 'Fix unitehub.ai DNS error', column: 'hot', business: 'UH', priority: 1 },
  { id: '2', title: 'Build KPI cards /staff/dashboard', column: 'hot', business: 'UH', priority: 1 },
  { id: '3', title: 'Phill OS /founder/os live', column: 'today', business: 'UH', priority: 1 },
  { id: '4', title: 'Activate SEO Intelligence API', column: 'today', business: 'UH', priority: 1 },
  { id: '5', title: 'Revenue activation sprint', column: 'today', business: 'ALL', priority: 1 },
  { id: '6', title: 'Per-business drill-down pages', column: 'pipeline', business: 'UH', priority: 2 },
  { id: '7', title: 'Phill OS chat + speech', column: 'pipeline', business: 'UH', priority: 2 },
  { id: '8', title: 'SEO competitor gap analysis', column: 'pipeline', business: 'UH', priority: 2 },
];

function mapIssueToKanban(issue: LinearIssueNode): KanbanItem {
  let column: KanbanItem['column'];

  if (issue.priority === 1 && issue.state.type === 'started') {
    column = 'hot';
  } else if (issue.priority === 1) {
    column = 'today';
  } else {
    column = 'pipeline';
  }

  return {
    id: issue.id,
    title: `${issue.identifier}: ${issue.title}`,
    column,
    business: 'UH',
    priority: issue.priority,
  };
}

export async function GET() {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ items: STATIC_ITEMS, source: 'static' });
  }

  try {
    const query = `{ team(id: "ab9c7810-4dd6-4ce2-8e8f-e1fc94c6b88b") { issues(filter: { project: { id: { eq: "b62d9b14-9d9c-46c7-a3f4-05fbd49550ff" } }, state: { type: { nin: ["cancelled", "completed"] } } }, first: 50, orderBy: createdAt) { nodes { id identifier title priority state { type name } } } } }`;

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      return NextResponse.json({ items: STATIC_ITEMS, source: 'static', error: 'Linear API error' });
    }

    const data = await res.json();
    const nodes: LinearIssueNode[] = data?.data?.team?.issues?.nodes ?? [];

    if (nodes.length === 0) {
      return NextResponse.json({ items: STATIC_ITEMS, source: 'static' });
    }

    const items = nodes.map(mapIssueToKanban);
    return NextResponse.json({ items, source: 'linear' });
  } catch {
    return NextResponse.json({ items: STATIC_ITEMS, source: 'static', error: 'Failed to fetch from Linear' });
  }
}
