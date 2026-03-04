import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          AI Agent Orchestration
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Production-ready monorepo for building AI-powered applications with
          Next.js, LangGraph, and Claude.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
