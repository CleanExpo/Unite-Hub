import { redirect } from 'next/navigation';
import { getStaffSession } from '@/lib/auth/supabase';
import { KanbanBoard } from '@/components/kanban';

export const metadata = { title: 'Kanban — Unite-Group' };

export default async function KanbanPage() {
  const { session, error } = await getStaffSession();
  if (error || !session || !session.user) redirect('/auth/login');

  const workspaceId = session.user.user_metadata?.workspace_id ?? session.user.id;

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#050505] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-mono tracking-widest text-white">◈ KANBAN</h1>
          <p className="text-xs text-white/30 font-mono mt-0.5">Tasks · Obsidian Sync · AI Agent Orchestration</p>
        </div>
        <a href="/kanban/settings"
          className="px-3 py-1.5 text-xs font-mono text-white/40 border border-white/10 rounded-sm hover:text-white/60 hover:border-white/20 transition-colors">
          ⚙ Vault Settings
        </a>
      </div>
      <KanbanBoard workspaceId={workspaceId} />
    </div>
  );
}
