import { NextRequest } from "next/server";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import {
  exportToGitHub,
  validateGitHubToken,
} from "@/lib/synthex/stitch-inspired/github-export";
import {
  deployToVercel,
  validateVercelToken,
} from "@/lib/synthex/stitch-inspired/vercel-deploy";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * POST /api/synthex/design-studio/export?workspaceId={id}&format={zip|github|vercel}
 *
 * Export generated design code in specified format
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const format = req.nextUrl.searchParams.get("format");

  if (!workspaceId) {
    return errorResponse("workspaceId query parameter required", 400);
  }

  if (!format || !["zip", "github", "vercel"].includes(format)) {
    return errorResponse(
      "format must be one of: zip, github, vercel",
      400
    );
  }

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { projectId, versionId, code, tailwindConfig, githubOptions, vercelOptions } = body;

  if (!code) {
    return errorResponse("code is required", 400);
  }

  try {
    const supabase = getSupabaseServer();

    // Handle different export formats
    if (format === "zip") {
      return await handleZipExport(
        code,
        tailwindConfig,
        projectId,
        versionId,
        supabase,
        workspaceId
      );
    } else if (format === "github") {
      return await handleGitHubExport(
        code,
        tailwindConfig,
        projectId,
        versionId,
        githubOptions,
        supabase,
        workspaceId
      );
    } else if (format === "vercel") {
      return await handleVercelExport(
        code,
        tailwindConfig,
        projectId,
        versionId,
        vercelOptions,
        supabase,
        workspaceId
      );
    }

    return errorResponse("Unsupported export format", 400);
  } catch (error) {
    console.error("Export failed:", error);
    return errorResponse(
      `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
});

// ============================================================================
// Handler Functions
// ============================================================================

async function handleZipExport(
  code: string,
  tailwindConfig: string | undefined,
  projectId: string,
  versionId: string,
  supabase: any,
  workspaceId: string
): Promise<Response> {
  try {
    // Create ZIP file content (simplified - in production use archiver)
    const zipData = {
      files: {
        "app.tsx": code,
        ...(tailwindConfig && { "tailwind.config.ts": tailwindConfig }),
        "package.json": generatePackageJson(),
        "README.md": generateReadme(),
      },
    };

    // Store export record
    if (projectId && versionId) {
      await supabase.from("synthex_design_exports").insert({
        project_id: projectId,
        version_id: versionId,
        export_type: "zip-download",
        status: "completed",
        created_at: new Date().toISOString(),
      });
    }

    return successResponse({
      format: "zip",
      downloadUrl: `/api/synthex/design-studio/download?projectId=${projectId}&versionId=${versionId}`,
      message: "ZIP file ready for download",
    });
  } catch (error) {
    throw error;
  }
}

async function handleGitHubExport(
  code: string,
  tailwindConfig: string | undefined,
  projectId: string,
  versionId: string,
  githubOptions: any,
  supabase: any,
  workspaceId: string
): Promise<Response> {
  if (!githubOptions || !githubOptions.token) {
    return errorResponse("GitHub token required in githubOptions", 400);
  }

  // Validate token
  const isValid = await validateGitHubToken(githubOptions.token);
  if (!isValid) {
    return errorResponse("Invalid GitHub token", 401);
  }

  try {
    const result = await exportToGitHub(code, tailwindConfig, {
      token: githubOptions.token,
      owner: githubOptions.owner,
      repo: githubOptions.repo || `synthex-design-${Date.now()}`,
      branch: githubOptions.branch || "main",
      createRepo: githubOptions.createRepo !== false,
      commitMessage: githubOptions.commitMessage,
      author: githubOptions.author,
    });

    // Store export record
    if (projectId && versionId) {
      await supabase.from("synthex_design_exports").insert({
        project_id: projectId,
        version_id: versionId,
        export_type: "github-push",
        export_url: result.repoUrl,
        export_metadata: {
          commitSha: result.commitSha,
          branch: result.branch,
          files: result.files,
        },
        status: "completed",
        created_at: new Date().toISOString(),
      });
    }

    return successResponse({
      format: "github",
      repoUrl: result.repoUrl,
      commitSha: result.commitSha,
      branch: result.branch,
      files: result.files,
      message: `Exported to GitHub: ${result.repoUrl}`,
    });
  } catch (error) {
    throw error;
  }
}

async function handleVercelExport(
  code: string,
  tailwindConfig: string | undefined,
  projectId: string,
  versionId: string,
  vercelOptions: any,
  supabase: any,
  workspaceId: string
): Promise<Response> {
  if (!vercelOptions || !vercelOptions.token) {
    return errorResponse("Vercel token required in vercelOptions", 400);
  }

  // Validate token
  const isValid = await validateVercelToken(vercelOptions.token);
  if (!isValid) {
    return errorResponse("Invalid Vercel token", 401);
  }

  try {
    const packageJson = generatePackageJson();

    const result = await deployToVercel(code, tailwindConfig, packageJson, {
      token: vercelOptions.token,
      projectName:
        vercelOptions.projectName || `synthex-design-${Date.now()}`,
      teamId: vercelOptions.teamId,
      buildCommand: vercelOptions.buildCommand,
      installCommand: vercelOptions.installCommand,
      outputDirectory: vercelOptions.outputDirectory,
    });

    // Store export record
    if (projectId && versionId) {
      await supabase.from("synthex_design_exports").insert({
        project_id: projectId,
        version_id: versionId,
        export_type: "vercel-deploy",
        export_url: result.deploymentUrl,
        export_metadata: {
          projectId: result.projectId,
          projectUrl: result.projectUrl,
          status: result.status,
        },
        status: "completed",
        created_at: new Date().toISOString(),
      });
    }

    return successResponse({
      format: "vercel",
      deploymentUrl: result.deploymentUrl,
      projectUrl: result.projectUrl,
      projectId: result.projectId,
      status: result.status,
      message: `Deployed to Vercel: ${result.deploymentUrl}`,
    });
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function generatePackageJson(): string {
  return JSON.stringify(
    {
      name: "synthex-design",
      version: "1.0.0",
      description: "AI-generated design with Synthex Design Studio",
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        next: "^15.0.0",
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@types/node": "^20.0.0",
        typescript: "^5.0.0",
        tailwindcss: "^3.4.0",
        postcss: "^8.4.0",
        autoprefixer: "^10.4.0",
      },
    },
    null,
    2
  );
}

function generateReadme(): string {
  return `# AI-Generated Design by Synthex

Created with Synthex Design Studio powered by Gemini 3 Pro.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

Visit \`http://localhost:3000\` to see your design.

## Customization

Edit \`app.tsx\` to customize your design. All changes hot-reload automatically.

## Deploy

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## Features

- ✨ Responsive design
- 🎨 Tailwind CSS
- ⚛️ React 19
- 📱 Mobile-first
- ♿ Accessible (WCAG 2.1 AA)

## Learn More

- [Synthex Design Studio](https://synthex.ai)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
`;
}
