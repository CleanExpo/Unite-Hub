#!/bin/bash

# NodeJS-Starter-V1 Dependency Verification Functions
# Reusable functions for checking dependencies across the pnpm workspace
# Source this file in verify.sh or run standalone

# ============================================================================
# Function 1: Check Lockfile Integrity
# ============================================================================
check_lockfile_integrity() {
    local lockfile="pnpm-lock.yaml"
    local package_json="package.json"

    # Check existence
    if [ ! -f "$lockfile" ]; then
        echo "ERROR:MISSING:Lockfile $lockfile does not exist"
        return 1
    fi

    if [ ! -f "$package_json" ]; then
        echo "ERROR:MISSING:$package_json does not exist"
        return 1
    fi

    # Check YAML validity (look for lockfileVersion header)
    if ! grep -q "lockfileVersion:" "$lockfile"; then
        echo "ERROR:INVALID:Lockfile missing lockfileVersion header"
        return 1
    fi

    # Check modification times to see if package.json is newer
    local pkg_mtime pkg_mtime_unix lock_mtime lock_mtime_unix

    # Handle both macOS (stat -f) and Linux (stat -c)
    if stat -f %m "$package_json" >/dev/null 2>&1; then
        # macOS
        pkg_mtime_unix=$(stat -f %m "$package_json")
        lock_mtime_unix=$(stat -f %m "$lockfile")
    else
        # Linux
        pkg_mtime_unix=$(stat -c %Y "$package_json")
        lock_mtime_unix=$(stat -c %Y "$lockfile")
    fi

    if [ "$lock_mtime_unix" -lt "$pkg_mtime_unix" ]; then
        echo "WARN:OUTDATED:Lockfile is older than package.json (may be out of sync)"
        return 2
    fi

    return 0
}

# ============================================================================
# Function 2: Check Dependency Synchronization
# Verifies that declared dependencies are installed with correct versions
# ============================================================================
check_dependency_sync() {
    local workspace="${1:-.}"
    local package_json="$workspace/package.json"

    if [ ! -f "$package_json" ]; then
        echo "ERROR:NOTFOUND:package.json not found in $workspace"
        return 1
    fi

    # Use Node.js to parse package.json and verify installations
    local node_script=$(cat << 'NODEJS_SCRIPT'
const fs = require('fs');
const path = require('path');
const workspace = process.argv[1];
const cwd = process.cwd();

try {
    const pkgPath = path.join(workspace, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const deps = {};

    // Collect all dependencies
    if (pkg.dependencies) {
        Object.assign(deps, pkg.dependencies);
    }
    if (pkg.devDependencies) {
        Object.assign(deps, pkg.devDependencies);
    }

    const issues = [];

    // Check each dependency
    for (const [name, version] of Object.entries(deps)) {
        // Skip workspace: dependencies
        if (version.startsWith('workspace:')) {
            continue;
        }

        // Determine module paths to check
        const localModulePath = path.join(workspace, 'node_modules', name, 'package.json');
        const rootModulePath = path.join(cwd, 'node_modules', name, 'package.json');

        let installed = false;
        let installedVersion = null;

        // Check if installed locally
        if (fs.existsSync(localModulePath)) {
            try {
                const mod = JSON.parse(fs.readFileSync(localModulePath, 'utf8'));
                installed = true;
                installedVersion = mod.version;
            } catch (e) {
                // Ignore parse errors
            }
        }

        // Check if installed in root node_modules (for pnpm hoisting)
        if (!installed && fs.existsSync(rootModulePath)) {
            try {
                const mod = JSON.parse(fs.readFileSync(rootModulePath, 'utf8'));
                installed = true;
                installedVersion = mod.version;
            } catch (e) {
                // Ignore parse errors
            }
        }

        // Report issues
        if (!installed) {
            issues.push(`MISSING:${name}:${version}:not_installed`);
        } else if (installedVersion) {
            // Check for version mismatch
            // Remove common semver prefixes from declared version
            const declaredClean = version.replace(/^[\^~>=<]+/, '').split('.')[0];
            const installedMajor = installedVersion.split('.')[0];

            // Only report mismatch if major version differs
            if (declaredClean !== '*' && declaredClean !== installedMajor && !version.includes(installedVersion)) {
                issues.push(`MISMATCH:${name}:${version}:${installedVersion}`);
            }
        }
    }

    // Output results
    issues.forEach(issue => console.log(issue));
    process.exit(issues.length > 0 ? 1 : 0);
} catch (error) {
    console.error(`ERROR:${error.message}`);
    process.exit(1);
}
NODEJS_SCRIPT
)

    # Run Node.js script
    node -e "$node_script" "$workspace"
    return $?
}

# ============================================================================
# Function 3: Check for Orphaned Dependencies
# Finds packages in node_modules that aren't declared in package.json
# ============================================================================
check_orphaned_dependencies() {
    local workspace="${1:-.}"
    local node_modules="$workspace/node_modules"

    if [ ! -d "$node_modules" ]; then
        # No node_modules directory - nothing to check
        return 0
    fi

    local package_json="$workspace/package.json"
    if [ ! -f "$package_json" ]; then
        return 1
    fi

    # Use Node.js to find orphans
    local node_script=$(cat << 'NODEJS_SCRIPT'
const fs = require('fs');
const path = require('path');
const workspace = process.argv[1];

try {
    const pkgPath = path.join(workspace, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    const declared = {};

    // Collect declared dependencies
    if (pkg.dependencies) {
        Object.assign(declared, pkg.dependencies);
    }
    if (pkg.devDependencies) {
        Object.assign(declared, pkg.devDependencies);
    }

    const nodeModulesPath = path.join(workspace, 'node_modules');
    const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });

    const orphans = [];

    for (const entry of entries) {
        // Skip @scoped directories initially
        if (entry.name.startsWith('.') || entry.name === '.bin') {
            continue;
        }

        if (entry.isDirectory()) {
            // Check if it's a scoped package
            if (entry.name.startsWith('@')) {
                // For scoped packages like @babel/core, check subdirectories
                const scopePath = path.join(nodeModulesPath, entry.name);
                const scopedEntries = fs.readdirSync(scopePath, { withFileTypes: true });

                for (const scopedEntry of scopedEntries) {
                    if (scopedEntry.isDirectory() && !scopedEntry.name.startsWith('.')) {
                        const fullName = `${entry.name}/${scopedEntry.name}`;
                        if (!declared[fullName]) {
                            const pkgJsonPath = path.join(scopePath, scopedEntry.name, 'package.json');
                            if (fs.existsSync(pkgJsonPath)) {
                                try {
                                    const mod = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                                    orphans.push(`ORPHANED:${fullName}:${mod.version || 'unknown'}`);
                                } catch (e) {
                                    // Ignore parse errors
                                }
                            }
                        }
                    }
                }
            } else {
                // Regular package
                if (!declared[entry.name]) {
                    const pkgJsonPath = path.join(nodeModulesPath, entry.name, 'package.json');
                    if (fs.existsSync(pkgJsonPath)) {
                        try {
                            const mod = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                            orphans.push(`ORPHANED:${entry.name}:${mod.version || 'unknown'}`);
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            }
        }
    }

    // Output results
    orphans.forEach(orphan => console.log(orphan));
    process.exit(orphans.length > 0 ? 1 : 0);
} catch (error) {
    console.error(`ERROR:${error.message}`);
    process.exit(1);
}
NODEJS_SCRIPT
)

    # Run Node.js script
    node -e "$node_script" "$workspace"
    return $?
}

# ============================================================================
# Function 4: Check Workspace Consistency
# Detects version conflicts for same package across different workspaces
# ============================================================================
check_workspace_consistency() {
    local node_script=$(cat << 'NODEJS_SCRIPT'
const fs = require('fs');
const path = require('path');

try {
    const workspaces = ['.', 'apps/web', 'packages/config'];
    const depMatrix = {};

    // Collect all dependencies from all workspaces
    for (const ws of workspaces) {
        const pkgPath = path.join(ws, 'package.json');

        if (!fs.existsSync(pkgPath)) {
            continue;
        }

        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const deps = {};

            if (pkg.dependencies) {
                Object.assign(deps, pkg.dependencies);
            }
            if (pkg.devDependencies) {
                Object.assign(deps, pkg.devDependencies);
            }

            for (const [name, version] of Object.entries(deps)) {
                if (version.startsWith('workspace:')) {
                    continue;
                }

                if (!depMatrix[name]) {
                    depMatrix[name] = [];
                }

                depMatrix[name].push({
                    workspace: ws,
                    version: version
                });
            }
        } catch (e) {
            // Ignore parse errors for non-existent packages
        }
    }

    // Find conflicts (same package with different versions)
    const conflicts = [];
    for (const [name, usages] of Object.entries(depMatrix)) {
        const versions = [...new Set(usages.map(u => u.version))];

        if (versions.length > 1) {
            conflicts.push({
                package: name,
                versions: versions,
                usages: usages
            });
        }
    }

    // Report conflicts
    if (conflicts.length > 0) {
        conflicts.forEach(conflict => {
            console.log(`CONFLICT:${conflict.package}`);
            conflict.usages.forEach(usage => {
                console.log(`  ${usage.workspace}:${usage.version}`);
            });
        });
        process.exit(1);
    }

    process.exit(0);
} catch (error) {
    console.error(`ERROR:${error.message}`);
    process.exit(1);
}
NODEJS_SCRIPT
)

    # Run Node.js script
    node -e "$node_script"
    return $?
}

# ============================================================================
# Main execution (if script is run directly, not sourced)
# ============================================================================
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    echo "Dependency verification functions module."
    echo "Source this script in verify.sh: source scripts/dependency-checks.sh"
    echo ""
    echo "Available functions:"
    echo "  check_lockfile_integrity()"
    echo "  check_dependency_sync <workspace>"
    echo "  check_orphaned_dependencies <workspace>"
    echo "  check_workspace_consistency()"
    exit 0
fi
