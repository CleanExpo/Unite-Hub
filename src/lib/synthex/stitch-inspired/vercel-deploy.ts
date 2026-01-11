/**
 * Vercel Deployment Service
 * Deploys generated UI code to Vercel for instant preview links
 */

export interface VercelDeployOptions {
  token: string; // Vercel API token
  projectName?: string;
  teamId?: string; // Vercel team ID (optional)
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
}

export interface VercelDeployResult {
  projectId: string;
  deploymentUrl: string;
  projectUrl: string;
  buildLogs?: string;
  status: "ready" | "building" | "failed";
  timestamp: string;
}

/**
 * Deploy generated code to Vercel
 */
export async function deployToVercel(
  code: string,
  tailwindConfig: string | undefined,
  packageJson: string,
  options: VercelDeployOptions
): Promise<VercelDeployResult> {
  if (!options.token) {
    throw new Error("Vercel token required");
  }

  try {
    // Create deployment payload
    const files = generateFileStructure(code, tailwindConfig, packageJson);

    const payload = {
      name: options.projectName || `synthex-design-${Date.now()}`,
      public: true,
      files: files.map((f) => ({
        file: f.path,
        data: f.content,
      })),
      env: {
        NEXT_PUBLIC_VERCEL_ENV: "production",
      },
      buildCommand: options.buildCommand || "npm run build",
      installCommand: options.installCommand || "npm install",
      outputDirectory: options.outputDirectory || ".next",
    };

    // Call Vercel API
    const response = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }

    const deployment = await response.json();

    // Poll for deployment status
    let status: "ready" | "building" | "failed" = "building";
    let deploymentUrl = `https://${deployment.url}`;

    // Wait for deployment to be ready (with timeout)
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const pollInterval = 3000; // 3 seconds
    let elapsedTime = 0;

    while (elapsedTime < maxWaitTime) {
      const statusResponse = await fetch(
        `https://api.vercel.com/v13/deployments/${deployment.id}`,
        {
          headers: { Authorization: `Bearer ${options.token}` },
        }
      );

      if (statusResponse.ok) {
        const deploymentStatus = await statusResponse.json();

        if (deploymentStatus.state === "READY") {
          status = "ready";
          break;
        } else if (deploymentStatus.state === "ERROR") {
          status = "failed";
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }

    return {
      projectId: deployment.id,
      deploymentUrl,
      projectUrl: `https://vercel.com/${deployment.name}`,
      status,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate file structure for Vercel deployment
 */
function generateFileStructure(
  code: string,
  tailwindConfig: string | undefined,
  packageJson: string
): Array<{ path: string; content: string }> {
  return [
    {
      path: "app.tsx",
      content: code,
    },
    ...(tailwindConfig
      ? [
          {
            path: "tailwind.config.ts",
            content: tailwindConfig,
          },
        ]
      : []),
    {
      path: "package.json",
      content: packageJson,
    },
    {
      path: "README.md",
      content: generateReadme(),
    },
    {
      path: "tsconfig.json",
      content: generateTsConfig(),
    },
    {
      path: "next.config.js",
      content: generateNextConfig(),
    },
    {
      path: "postcss.config.js",
      content: generatePostCssConfig(),
    },
  ];
}

/**
 * Generate README for Vercel deployment
 */
function generateReadme(): string {
  return `# Synthex Design - Vercel Preview

This is a live preview of an AI-generated design created with Synthex Design Studio.

**Powered by Gemini 3 Pro**

## Features

- ✨ AI-generated responsive design
- 🎨 Tailwind CSS styling
- ⚛️ React 19 + TypeScript
- 🔍 SEO optimized
- ♿ WCAG 2.1 AA accessibility

## Customize

To customize this design:
1. Clone the repository
2. Edit \`app.tsx\`
3. Deploy to Vercel

## Learn More

- [Synthex Design Studio](https://synthex.ai/design-studio)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
`;
}

/**
 * Generate tsconfig.json
 */
function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        moduleResolution: "node",
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
        },
      },
      include: ["**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"],
    },
    null,
    2
  );
}

/**
 * Generate next.config.js
 */
function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
`;
}

/**
 * Generate postcss.config.js
 */
function generatePostCssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

/**
 * Validate Vercel token
 */
export async function validateVercelToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.vercel.com/v2/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * List Vercel projects
 */
export async function listVercelProjects(
  token: string,
  teamId?: string
): Promise<Array<{ id: string; name: string; url: string }>> {
  try {
    const url = new URL("https://api.vercel.com/v9/projects");
    if (teamId) {
      url.searchParams.set("teamId", teamId);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    const data = (await response.json()) as any;
    return (data.projects || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      url: p.targets?.production?.url || `https://${p.name}.vercel.app`,
    }));
  } catch (error) {
    console.error("Failed to list Vercel projects:", error);
    return [];
  }
}
