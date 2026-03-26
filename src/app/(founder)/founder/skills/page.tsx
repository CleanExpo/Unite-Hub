import { SkillHealthDashboard } from '@/components/founder/skills/SkillHealthDashboard'

export const metadata = { title: 'Skills | Nexus' }

export default function SkillsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Skill Health
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Automated evaluation scores for Claude Code skills
        </p>
      </div>
      <SkillHealthDashboard />
    </div>
  )
}
