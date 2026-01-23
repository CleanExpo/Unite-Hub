import { Metadata } from "next";
import { CouncilDeliberationDemo } from "@/components/ui/council-deliberation";

export const metadata: Metadata = {
  title: "Council of Logic | Unite-Hub Showcase",
  description:
    "Mathematical First Principles deliberation with Turing, von Neumann, Bézier, and Shannon",
};

export default function CouncilOfLogicShowcase() {
  return (
    <div className="min-h-screen bg-bg-primary py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-8">
          <a href="/" className="hover:text-accent-400 transition-colors">
            Home
          </a>
          <span>/</span>
          <a
            href="/showcases"
            className="hover:text-accent-400 transition-colors"
          >
            Showcases
          </a>
          <span>/</span>
          <span className="text-text-primary">Council of Logic</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">
              Mathematical First Principles
            </span>
          </div>

          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Council of Logic
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Every AI operation evaluated through the lens of four legendary
            mathematicians and scientists. No O(n²) escapes Turing. No linear
            animation survives Bézier.
          </p>
        </div>

        {/* Council Members Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <MemberCard
            name="Alan Turing"
            role="Algorithmic Efficiency"
            focus="O(n) or O(log n) only"
            color="blue"
            icon="💻"
          />
          <MemberCard
            name="John von Neumann"
            role="Game Theory"
            focus="Nash equilibrium"
            color="purple"
            icon="🎯"
          />
          <MemberCard
            name="Pierre Bézier"
            role="Animation Physics"
            focus="No linear transitions"
            color="pink"
            icon="✨"
          />
          <MemberCard
            name="Claude Shannon"
            role="Token Economy"
            focus="Max signal, min noise"
            color="emerald"
            icon="📊"
          />
        </div>

        {/* Interactive Demo */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Interactive Deliberation Demo
          </h2>
          <CouncilDeliberationDemo />
        </section>

        {/* Workflow Steps */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            The Three-Step Protocol
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              number={1}
              title="THE PROOF"
              description="Before writing code, state the mathematical/logical model being used. Identify applicable theorems and constraints."
              color="blue"
            />
            <StepCard
              number={2}
              title="THE SOLVE"
              description="Implement the solution following proven complexity bounds. Apply domain-specific optimisations."
              color="purple"
            />
            <StepCard
              number={3}
              title="THE VERIFY"
              description="Council deliberation. Each member evaluates their domain. Unanimous approval or documented override required."
              color="emerald"
            />
          </div>
        </section>

        {/* Integration Code */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Integration Guide
          </h2>

          <div className="bg-bg-elevated rounded-xl border border-border-primary overflow-hidden">
            <div className="bg-bg-tertiary px-4 py-2 border-b border-border-primary">
              <span className="text-xs font-mono text-text-muted">
                Usage in your agent
              </span>
            </div>
            <pre className="p-4 text-sm text-text-secondary overflow-x-auto">
              <code>{`import { getCouncilOfLogic } from '@/lib/agents/council-of-logic';

const council = getCouncilOfLogic();

// Full deliberation
const verdict = await council.deliberate({
  operation: 'generate_campaign',
  code: campaignCode,
  context: { userCount: 1000 }
});

if (verdict.finalVerdict === 'approved') {
  // Proceed with operation
} else {
  // Handle recommendations
  console.log(verdict.verdicts.map(v => v.recommendations));
}

// Quick evaluation (single member)
const turingCheck = await council.quickEvaluate(
  'Alan_Turing',
  myAlgorithm
);
console.log(\`Turing score: \${turingCheck.score}\`);`}</code>
            </pre>
          </div>
        </section>

        {/* Design Philosophy */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-bg-card rounded-xl p-6 border border-border-primary">
            <h3 className="text-lg font-semibold text-accent-400 mb-3">
              Why This Matters
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              AI systems often optimise for the wrong metrics. The Council of
              Logic ensures every operation meets rigorous mathematical standards
              before execution. No more O(n²) loops destroying performance. No
              more linear animations breaking the luxury feel.
            </p>
          </div>

          <div className="bg-bg-card rounded-xl p-6 border border-border-primary">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">
              Veto Power
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Alan Turing holds veto power. If an operation fails algorithmic
              efficiency standards (O(n²) or worse without justification), the
              entire operation is rejected regardless of other member scores.
              Non-negotiable computational integrity.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function MemberCard({
  name,
  role,
  focus,
  color,
  icon,
}: {
  name: string;
  role: string;
  focus: string;
  color: "blue" | "purple" | "pink" | "emerald";
  icon: string;
}) {
  const colors = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    pink: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colors[color].split(" ").slice(0, 2).join(" ")}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className={`font-semibold text-sm ${colors[color].split(" ")[2]}`}>
        {name}
      </h3>
      <p className="text-xs text-text-muted mt-1">{role}</p>
      <p className="text-xs text-text-secondary mt-2 font-mono">{focus}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  color,
}: {
  number: number;
  title: string;
  description: string;
  color: "blue" | "purple" | "emerald";
}) {
  const colors = {
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white",
    emerald: "bg-emerald-500 text-white",
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-primary p-6">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold mb-4 ${colors[color]}`}
      >
        {number}
      </div>
      <h3 className="font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  );
}
