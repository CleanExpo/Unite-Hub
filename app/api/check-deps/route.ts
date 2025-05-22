import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Read package.json
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent)

    // Check for required dependencies
    const requiredDeps = ["@supabase/auth-helpers-nextjs", "@supabase/supabase-js", "next", "react", "react-dom"]

    const missingDeps = requiredDeps.filter(
      (dep) => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep],
    )

    return NextResponse.json({
      packageJson: {
        name: packageJson.name,
        version: packageJson.version,
        dependencies: packageJson.dependencies,
        devDependencies: packageJson.devDependencies,
      },
      missingDependencies: missingDeps,
      status: missingDeps.length === 0 ? "All required dependencies installed" : "Missing dependencies",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to check dependencies",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
