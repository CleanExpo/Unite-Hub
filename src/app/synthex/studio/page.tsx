'use client';

/**
 * Synthex Studio Pod - Hero Product Experience
 *
 * This is the primary entry point for Synthex users after authentication.
 * Studio Pod is THE product, not a dashboard tab.
 *
 * Features:
 * - Create new projects
 * - View progress
 * - See generated outputs
 * - Manage workspace
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plus,
  ArrowRight,
  Sparkles,
  Zap,
  Play,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SynthexStudioPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        // TODO: Fetch from /api/synthex/projects
        setLoadingProjects(false);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setLoadingProjects(false);
      }
    };

    if (!loading && user) {
      loadProjects();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleCreateProject = () => {
    // TODO: Navigate to project creation or open dialog
    router.push('/synthex/studio/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-accent-500 animate-pulse mx-auto mb-4" />
          <p className="text-text-secondary">Loading Synthex Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-border-subtle bg-bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Synthex Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-text-secondary text-sm">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-bg-card rounded-lg transition-colors text-text-secondary hover:text-text-primary"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Create. Generate. Publish.
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
              Your AI marketing assistant is ready. Create content, generate videos, and publish across channels—all in one place.
            </p>
            <Button
              onClick={handleCreateProject}
              className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Project
            </Button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-bg-card hover:bg-bg-card/80 border-border-subtle cursor-pointer transition-colors p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Quick Start</h3>
              <p className="text-text-secondary text-sm mb-4">
                Create your first project in seconds
              </p>
              <ArrowRight className="w-5 h-5 text-accent-500" />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-bg-card hover:bg-bg-card/80 border-border-subtle cursor-pointer transition-colors p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-accent-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">View Results</h3>
              <p className="text-text-secondary text-sm mb-4">
                Track progress and see your generated content
              </p>
              <ArrowRight className="w-5 h-5 text-accent-500" />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-bg-card hover:bg-bg-card/80 border-border-subtle cursor-pointer transition-colors p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-accent-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
              <p className="text-text-secondary text-sm mb-4">
                Manage your workspace and preferences
              </p>
              <ArrowRight className="w-5 h-5 text-accent-500" />
            </Card>
          </motion.div>
        </div>

        {/* Recent Projects Section */}
        {!loadingProjects && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Recent Projects</h3>
            {projects.length === 0 ? (
              <Card className="bg-bg-card border-border-subtle border-dashed p-12 text-center">
                <Sparkles className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary mb-4">No projects yet</p>
                <Button
                  onClick={handleCreateProject}
                  className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 rounded-lg font-semibold inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Project
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project: any) => (
                  <Card
                    key={project.id}
                    className="bg-bg-card hover:bg-bg-card/80 border-border-subtle cursor-pointer transition-colors p-6"
                  >
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {project.name}
                    </h4>
                    <p className="text-text-secondary text-sm mb-4">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 text-accent-500">
                      <Play className="w-4 h-4" />
                      <span className="text-sm">View project</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
