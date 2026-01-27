/**
 * Linear API Client
 *
 * Provides authenticated access to Linear.app API for project management integration.
 *
 * Features:
 * - OAuth authentication
 * - Project/Issue CRUD operations
 * - Webhook event handling
 * - Real-time sync with Unite-Hub tasks
 *
 * Environment Variables:
 * - LINEAR_API_KEY: Personal API key for server-side operations
 * - LINEAR_CLIENT_ID: OAuth client ID (for user auth)
 * - LINEAR_CLIENT_SECRET: OAuth client secret
 * - LINEAR_WEBHOOK_SECRET: Webhook signature verification
 */

import { LinearClient as LinearSDK } from '@linear/sdk';

// Types
export interface LinearConfig {
  apiKey?: string;
  accessToken?: string;
}

export interface LinearProject {
  id: string;
  name: string;
  description?: string;
  state: string;
  progress: number;
  url: string;
  teams: {
    id: string;
    name: string;
  }[];
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinearIssue {
  id: string;
  identifier: string; // e.g., "UH-123"
  title: string;
  description?: string;
  state: {
    id: string;
    name: string;
    type: string; // 'started', 'completed', 'canceled', etc.
  };
  priority: number; // 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
  };
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
  estimate?: number;
  dueDate?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  description?: string;
}

export interface LinearWebhookEvent {
  action: 'create' | 'update' | 'remove';
  type: 'Issue' | 'Project' | 'Comment';
  data: any;
  createdAt: string;
  organizationId: string;
  webhookId: string;
}

/**
 * Linear API Client
 */
export class LinearClient {
  private client: LinearSDK;
  private apiKey?: string;

  constructor(config: LinearConfig) {
    if (!config.apiKey && !config.accessToken) {
      throw new Error('Linear API key or access token required');
    }

    this.apiKey = config.apiKey;

    this.client = new LinearSDK({
      apiKey: config.apiKey,
      accessToken: config.accessToken,
    });
  }

  /**
   * Get authenticated user information
   */
  async getViewer() {
    const viewer = await this.client.viewer;
    return {
      id: viewer.id,
      name: viewer.name,
      email: viewer.email,
      admin: viewer.admin,
    };
  }

  /**
   * Get all teams
   */
  async getTeams(): Promise<LinearTeam[]> {
    const teams = await this.client.teams();
    const teamsList: LinearTeam[] = [];

    for (const team of teams.nodes) {
      teamsList.push({
        id: team.id,
        name: team.name,
        key: team.key,
        description: team.description,
      });
    }

    return teamsList;
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<LinearProject[]> {
    const projects = await this.client.projects();
    const projectsList: LinearProject[] = [];

    for (const project of projects.nodes) {
      const teams = await project.teams();

      projectsList.push({
        id: project.id,
        name: project.name,
        description: project.description,
        state: project.state,
        progress: project.progress,
        url: project.url,
        teams: teams.nodes.map(t => ({
          id: t.id,
          name: t.name,
        })),
        startDate: project.startDate,
        targetDate: project.targetDate,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      });
    }

    return projectsList;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<LinearProject | null> {
    const project = await this.client.project(projectId);
    if (!project) return null;

    const teams = await project.teams();

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      state: project.state,
      progress: project.progress,
      url: project.url,
      teams: teams.nodes.map(t => ({
        id: t.id,
        name: t.name,
      })),
      startDate: project.startDate,
      targetDate: project.targetDate,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  /**
   * Get issues for a project
   */
  async getProjectIssues(projectId: string): Promise<LinearIssue[]> {
    const project = await this.client.project(projectId);
    if (!project) return [];

    const issues = await project.issues();
    const issuesList: LinearIssue[] = [];

    for (const issue of issues.nodes) {
      const state = await issue.state;
      const assignee = await issue.assignee;
      const team = await issue.team;
      const labels = await issue.labels();
      const projectData = await issue.project;

      issuesList.push({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        state: state ? {
          id: state.id,
          name: state.name,
          type: state.type,
        } : { id: '', name: 'Unknown', type: 'unknown' },
        priority: issue.priority,
        assignee: assignee ? {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
        } : undefined,
        project: projectData ? {
          id: projectData.id,
          name: projectData.name,
        } : undefined,
        team: {
          id: team.id,
          name: team.name,
        },
        labels: labels.nodes.map(l => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })),
        estimate: issue.estimate,
        dueDate: issue.dueDate,
        url: issue.url,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
      });
    }

    return issuesList;
  }

  /**
   * Get all issues for a team
   */
  async getTeamIssues(teamId: string, options?: {
    limit?: number;
    state?: 'started' | 'completed' | 'canceled';
  }): Promise<LinearIssue[]> {
    const team = await this.client.team(teamId);
    if (!team) return [];

    const filter: any = {};
    if (options?.state) {
      filter.state = { type: { eq: options.state } };
    }

    const issues = await team.issues({
      first: options?.limit || 50,
      filter,
    });

    const issuesList: LinearIssue[] = [];

    for (const issue of issues.nodes) {
      const state = await issue.state;
      const assignee = await issue.assignee;
      const labels = await issue.labels();
      const project = await issue.project;

      issuesList.push({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        state: {
          id: state.id,
          name: state.name,
          type: state.type,
        },
        priority: issue.priority,
        assignee: assignee ? {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
        } : undefined,
        project: project ? {
          id: project.id,
          name: project.name,
        } : undefined,
        team: {
          id: team.id,
          name: team.name,
        },
        labels: labels.nodes.map(l => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })),
        estimate: issue.estimate,
        dueDate: issue.dueDate,
        url: issue.url,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
      });
    }

    return issuesList;
  }

  /**
   * Get issue by ID
   */
  async getIssue(issueId: string): Promise<LinearIssue | null> {
    const issue = await this.client.issue(issueId);
    if (!issue) return null;

    const state = await issue.state;
    const assignee = await issue.assignee;
    const team = await issue.team;
    const labels = await issue.labels();
    const project = await issue.project;

    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      state: {
        id: state.id,
        name: state.name,
        type: state.type,
      },
      priority: issue.priority,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
      } : undefined,
      project: project ? {
        id: project.id,
        name: project.name,
      } : undefined,
      team: {
        id: team.id,
        name: team.name,
      },
      labels: labels.nodes.map(l => ({
        id: l.id,
        name: l.name,
        color: l.color,
      })),
      estimate: issue.estimate,
      dueDate: issue.dueDate,
      url: issue.url,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
    };
  }

  /**
   * Create a new issue
   */
  async createIssue(input: {
    teamId: string;
    title: string;
    description?: string;
    priority?: number;
    projectId?: string;
    assigneeId?: string;
    labelIds?: string[];
    estimate?: number;
    dueDate?: string;
  }) {
    const payload = await this.client.createIssue({
      teamId: input.teamId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      labelIds: input.labelIds,
      estimate: input.estimate,
      dueDate: input.dueDate,
    });

    if (!payload.success) {
      throw new Error('Failed to create Linear issue');
    }

    const issue = await payload.issue;
    if (!issue) {
      throw new Error('Issue created but not returned');
    }

    return this.getIssue(issue.id);
  }

  /**
   * Update an existing issue
   */
  async updateIssue(issueId: string, input: {
    title?: string;
    description?: string;
    priority?: number;
    stateId?: string;
    assigneeId?: string;
    projectId?: string;
    labelIds?: string[];
    estimate?: number;
    dueDate?: string;
  }) {
    const payload = await this.client.updateIssue(issueId, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      stateId: input.stateId,
      assigneeId: input.assigneeId,
      projectId: input.projectId,
      labelIds: input.labelIds,
      estimate: input.estimate,
      dueDate: input.dueDate,
    });

    if (!payload.success) {
      throw new Error('Failed to update Linear issue');
    }

    return this.getIssue(issueId);
  }

  /**
   * Delete an issue
   */
  async deleteIssue(issueId: string) {
    const payload = await this.client.deleteIssue(issueId);
    return payload.success;
  }

  /**
   * Create a project
   */
  async createProject(input: {
    name: string;
    description?: string;
    teamIds: string[];
    startDate?: string;
    targetDate?: string;
  }) {
    const payload = await this.client.createProject({
      name: input.name,
      description: input.description,
      teamIds: input.teamIds,
      startDate: input.startDate,
      targetDate: input.targetDate,
    });

    if (!payload.success) {
      throw new Error('Failed to create Linear project');
    }

    const project = await payload.project;
    if (!project) {
      throw new Error('Project created but not returned');
    }

    return this.getProject(project.id);
  }
}

/**
 * Create a Linear client instance
 */
export function createLinearClient(config: LinearConfig): LinearClient {
  return new LinearClient(config);
}

/**
 * Get Linear client with server-side API key
 */
export function getLinearClient(): LinearClient {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    throw new Error('LINEAR_API_KEY environment variable is required');
  }

  return createLinearClient({ apiKey });
}

/**
 * Get Linear client with user's access token
 */
export function getLinearClientWithToken(accessToken: string): LinearClient {
  return createLinearClient({ accessToken });
}
