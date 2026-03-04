import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface RouteInfo {
  path: string;
  methods: string[];
  file: string;
  status: "verified" | "unverified" | "error";
  response_time_ms?: number;
  error?: string;
}

interface RouteHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  total_routes: number;
  verified_routes: number;
  failed_routes: number;
  routes: RouteInfo[];
}

// Known API routes in this project
const KNOWN_ROUTES: Array<{ path: string; methods: string[]; file: string }> = [
  { path: "/api/health", methods: ["GET"], file: "app/api/health/route.ts" },
  {
    path: "/api/health/deep",
    methods: ["GET"],
    file: "app/api/health/deep/route.ts",
  },
  {
    path: "/api/health/routes",
    methods: ["GET"],
    file: "app/api/health/routes/route.ts",
  },
  { path: "/api/chat", methods: ["POST"], file: "app/api/chat/route.ts" },
];

async function discoverRoutes(apiDir: string): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  async function scanDirectory(dir: string, basePath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip dynamic route segments for now
          if (!entry.name.startsWith("[")) {
            await scanDirectory(fullPath, `${basePath}/${entry.name}`);
          }
        } else if (entry.name === "route.ts" || entry.name === "route.js") {
          // Found a route file
          const content = await fs.readFile(fullPath, "utf-8");
          const methods: string[] = [];

          // Detect HTTP methods
          if (content.includes("export async function GET")) {
            methods.push("GET");
          }
          if (content.includes("export async function POST")) {
            methods.push("POST");
          }
          if (content.includes("export async function PUT")) {
            methods.push("PUT");
          }
          if (content.includes("export async function PATCH")) {
            methods.push("PATCH");
          }
          if (content.includes("export async function DELETE")) {
            methods.push("DELETE");
          }

          routes.push({
            path: basePath,
            methods,
            file: fullPath.replace(process.cwd(), "").replace(/\\/g, "/"),
            status: "unverified",
          });
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  await scanDirectory(apiDir, "/api");
  return routes;
}

async function verifyRoute(
  route: RouteInfo,
  baseUrl: string
): Promise<RouteInfo> {
  // Only verify GET endpoints for safety
  if (!route.methods.includes("GET")) {
    return { ...route, status: "unverified" };
  }

  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}${route.path}`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    const responseTime = Date.now() - start;

    if (response.ok) {
      return {
        ...route,
        status: "verified",
        response_time_ms: responseTime,
      };
    } else {
      return {
        ...route,
        status: "error",
        response_time_ms: responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (e) {
    return {
      ...route,
      status: "error",
      response_time_ms: Date.now() - start,
      error: e instanceof Error ? e.message : "Request failed",
    };
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<RouteHealthResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const verify = searchParams.get("verify") === "true";

  // Get base URL for verification
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  // Discover routes from filesystem
  const apiDir = path.join(process.cwd(), "app", "api");
  let routes = await discoverRoutes(apiDir);

  // Add known routes that might not be discovered
  for (const known of KNOWN_ROUTES) {
    const exists = routes.some((r) => r.path === known.path);
    if (!exists) {
      routes.push({
        path: known.path,
        methods: known.methods,
        file: known.file,
        status: "unverified",
      });
    }
  }

  // Sort routes by path
  routes.sort((a, b) => a.path.localeCompare(b.path));

  // Optionally verify routes (only GET endpoints)
  if (verify) {
    routes = await Promise.all(
      routes.map((route) => verifyRoute(route, baseUrl))
    );
  }

  const verifiedCount = routes.filter((r) => r.status === "verified").length;
  const failedCount = routes.filter((r) => r.status === "error").length;

  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (failedCount > 0) {
    status = failedCount > routes.length / 2 ? "unhealthy" : "degraded";
  }

  const response: RouteHealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    total_routes: routes.length,
    verified_routes: verifiedCount,
    failed_routes: failedCount,
    routes,
  };

  return NextResponse.json(response);
}
