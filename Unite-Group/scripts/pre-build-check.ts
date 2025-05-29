#!/usr/bin/env node

import { execSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

interface BuildCheck {
  name: string
  status: "pass" | "fail" | "warning"
  message: string
  fix?: string
}

class PreBuildChecker {
  private checks: BuildCheck[] = []
  private projectRoot: string

  constructor() {
    this.projectRoot = process.cwd()
  }

  private addCheck(check: BuildCheck) {
    this.checks.push(check)
    const icon = check.status === "pass" ? "✅" : check.status === "fail" ? "❌" : "⚠️"
    console.log(`${icon} ${check.name}: ${check.message}`)
    if (check.fix && check.status !== "pass") {
      console.log(`   Fix: ${check.fix}`)
    }
  }

  async checkEnvironmentVariables() {
    const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

    if (missingVars.length === 0) {
      this.addCheck({
        name: "Environment Variables",
        status: "pass",
        message: "All required environment variables are present",
      })
    } else {
      this.addCheck({
        name: "Environment Variables",
        status: "warning",
        message: `Missing: ${missingVars.join(", ")}`,
        fix: "Set missing environment variables in your deployment platform",
      })
    }
  }

  checkPackageJson() {
    const packageJsonPath = join(this.projectRoot, "package.json")

    if (!existsSync(packageJsonPath)) {
      this.addCheck({
        name: "Package.json",
        status: "fail",
        message: "package.json not found",
        fix: "Create package.json file",
      })
      return
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))

      // Check for required scripts
      const requiredScripts = ["build", "start", "dev"]
      const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script])

      if (missingScripts.length === 0) {
        this.addCheck({
          name: "Package.json Scripts",
          status: "pass",
          message: "All required scripts are present",
        })
      } else {
        this.addCheck({
          name: "Package.json Scripts",
          status: "fail",
          message: `Missing scripts: ${missingScripts.join(", ")}`,
          fix: "Add missing scripts to package.json",
        })
      }

      // Check for problematic dependencies
      const problematicDeps = ["canvas", "sharp"]
      const foundProblematic = problematicDeps.filter(
        (dep) => packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep],
      )

      if (foundProblematic.length > 0) {
        this.addCheck({
          name: "Problematic Dependencies",
          status: "warning",
          message: `Found: ${foundProblematic.join(", ")}`,
          fix: "Ensure these dependencies are properly configured for deployment",
        })
      }
    } catch (error) {
      this.addCheck({
        name: "Package.json",
        status: "fail",
        message: "Invalid package.json format",
        fix: "Fix JSON syntax in package.json",
      })
    }
  }

  checkNextConfig() {
    const nextConfigPath = join(this.projectRoot, "next.config.mjs")

    if (!existsSync(nextConfigPath)) {
      this.addCheck({
        name: "Next.js Config",
        status: "warning",
        message: "next.config.mjs not found",
        fix: "Create next.config.mjs for better build optimization",
      })
    } else {
      this.addCheck({
        name: "Next.js Config",
        status: "pass",
        message: "next.config.mjs found",
      })
    }
  }

  checkTypeScript() {
    const tsconfigPath = join(this.projectRoot, "tsconfig.json")

    if (!existsSync(tsconfigPath)) {
      this.addCheck({
        name: "TypeScript Config",
        status: "fail",
        message: "tsconfig.json not found",
        fix: "Create tsconfig.json file",
      })
      return
    }

    try {
      // Try to run TypeScript check
      execSync("npx tsc --noEmit", { stdio: "pipe" })
      this.addCheck({
        name: "TypeScript Check",
        status: "pass",
        message: "No TypeScript errors found",
      })
    } catch (error) {
      this.addCheck({
        name: "TypeScript Check",
        status: "warning",
        message: "TypeScript errors detected",
        fix: 'Run "npx tsc --noEmit" to see detailed errors',
      })
    }
  }

  checkCriticalFiles() {
    const criticalFiles = ["app/layout.tsx", "app/page.tsx", "app/globals.css", "tailwind.config.ts"]

    const missingFiles = criticalFiles.filter((file) => !existsSync(join(this.projectRoot, file)))

    if (missingFiles.length === 0) {
      this.addCheck({
        name: "Critical Files",
        status: "pass",
        message: "All critical files are present",
      })
    } else {
      this.addCheck({
        name: "Critical Files",
        status: "fail",
        message: `Missing: ${missingFiles.join(", ")}`,
        fix: "Create missing critical files",
      })
    }
  }

  async checkDependencies() {
    try {
      execSync("npm ls", { stdio: "pipe" })
      this.addCheck({
        name: "Dependencies",
        status: "pass",
        message: "All dependencies are properly installed",
      })
    } catch (error) {
      this.addCheck({
        name: "Dependencies",
        status: "warning",
        message: "Some dependency issues detected",
        fix: 'Run "npm install" to fix dependency issues',
      })
    }
  }

  async runAllChecks() {
    console.log("🔍 Running pre-build checks...\n")

    await this.checkEnvironmentVariables()
    this.checkPackageJson()
    this.checkNextConfig()
    this.checkTypeScript()
    this.checkCriticalFiles()
    await this.checkDependencies()

    console.log("\n📊 Build Check Summary:")
    const passed = this.checks.filter((c) => c.status === "pass").length
    const failed = this.checks.filter((c) => c.status === "fail").length
    const warnings = this.checks.filter((c) => c.status === "warning").length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  Warnings: ${warnings}`)

    if (failed > 0) {
      console.log("\n❌ Build is likely to fail. Please fix the issues above.")
      process.exit(1)
    } else if (warnings > 0) {
      console.log("\n⚠️  Build may succeed but consider fixing warnings for better reliability.")
    } else {
      console.log("\n✅ All checks passed! Build should succeed.")
    }
  }
}

// Run the checks
const checker = new PreBuildChecker()
checker.runAllChecks().catch(console.error)
