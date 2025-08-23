/**
 * Command Security Filter
 * Enforces security guardrails for shell commands
 */

export interface CommandCheck {
  allowed: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// Absolutely forbidden command patterns
const FORBIDDEN_PATTERNS = [
  // Authentication & Secrets
  { pattern: /^docker\s+login/i, reason: 'Docker login is forbidden to prevent credential exposure' },
  { pattern: /^npm\s+publish/i, reason: 'NPM publish is forbidden to prevent accidental package publication' },
  { pattern: /^npm\s+login/i, reason: 'NPM login is forbidden to prevent credential storage' },
  { pattern: /^echo\s+\$\w+/i, reason: 'Echoing environment variables is forbidden to prevent secret exposure' },
  { pattern: /^printenv/i, reason: 'Printing environment variables is forbidden' },
  { pattern: /^env\s*$/i, reason: 'Displaying all environment variables is forbidden' },
  { pattern: /^set\s*\|\s*grep/i, reason: 'Filtering environment variables is forbidden' },
  
  // Outbound Data Transfer
  { pattern: /curl\s+.*-d\s+/i, reason: 'POST data with curl is restricted to prevent data exfiltration' },
  { pattern: /curl\s+.*--data/i, reason: 'POST data with curl is restricted to prevent data exfiltration' },
  { pattern: /wget\s+.*--post/i, reason: 'POST data with wget is restricted to prevent data exfiltration' },
  { pattern: /nc\s+.*\s+<\s*/i, reason: 'Netcat reverse shells are forbidden' },
  
  // System Destruction
  { pattern: /^rm\s+-rf\s+\//i, reason: 'System-wide deletion is forbidden' },
  { pattern: /^chmod\s+777/i, reason: 'Setting world-writable permissions is forbidden' },
  { pattern: /^sudo\s+/i, reason: 'Sudo commands are forbidden' },
  
  // Credential Files
  { pattern: /cat\s+.*\.env/i, reason: 'Reading .env files directly is forbidden' },
  { pattern: /cat\s+.*secret/i, reason: 'Reading secret files is forbidden' },
  { pattern: /cat\s+.*\.pem/i, reason: 'Reading private keys is forbidden' },
  { pattern: /cat\s+.*\.key/i, reason: 'Reading private keys is forbidden' },
];

// Commands requiring user confirmation
const RESTRICTED_PATTERNS = [
  { 
    pattern: /^git\s+push/i, 
    confirmationMessage: 'This will push code to the remote repository. Continue?' 
  },
  { 
    pattern: /^npm\s+install\s+-g/i, 
    confirmationMessage: 'This will install packages globally. Continue?' 
  },
  { 
    pattern: /^curl\s+http/i, 
    confirmationMessage: 'This will make an external HTTP request. Continue?' 
  },
  { 
    pattern: /^wget\s+http/i, 
    confirmationMessage: 'This will download from an external source. Continue?' 
  },
  { 
    pattern: /^ssh\s+/i, 
    confirmationMessage: 'This will establish an SSH connection. Continue?' 
  },
  { 
    pattern: /^scp\s+/i, 
    confirmationMessage: 'This will copy files over SSH. Continue?' 
  },
];

// Safe command alternatives
const SAFE_ALTERNATIVES: Record<string, string> = {
  'echo $VAR': 'if [ -n "$VAR" ]; then echo "VAR is set"; fi',
  'printenv': 'echo "Environment configured"',
  'env': 'env | grep -E "^(PATH|HOME|USER)="',
  'cat .env': 'if [ -f .env ]; then echo ".env file exists"; fi',
  'npm publish': 'npm pack (creates tarball without publishing)',
  'docker login': 'Use CI/CD secrets management instead',
};

/**
 * Check if a command is allowed to execute
 */
export function checkCommand(command: string): CommandCheck {
  // Normalize command
  const normalizedCommand = command.trim();
  
  // Check forbidden patterns
  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (forbidden.pattern.test(normalizedCommand)) {
      const alternative = findAlternative(normalizedCommand);
      const reason = forbidden.reason + 
        (alternative ? `\nSafe alternative: ${alternative}` : '');
      
      return {
        allowed: false,
        reason,
      };
    }
  }
  
  // Check restricted patterns
  for (const restricted of RESTRICTED_PATTERNS) {
    if (restricted.pattern.test(normalizedCommand)) {
      return {
        allowed: true,
        requiresConfirmation: true,
        confirmationMessage: restricted.confirmationMessage,
      };
    }
  }
  
  // Check for potential secret exposure
  if (containsPotentialSecret(normalizedCommand)) {
    return {
      allowed: false,
      reason: 'Command may expose secrets. Use environment variables safely.',
    };
  }
  
  // Command is allowed
  return { allowed: true };
}

/**
 * Find safe alternative for forbidden command
 */
function findAlternative(command: string): string | undefined {
  for (const [pattern, alternative] of Object.entries(SAFE_ALTERNATIVES)) {
    if (command.includes(pattern.split(' ')[0])) {
      return alternative;
    }
  }
  return undefined;
}

/**
 * Check if command might expose secrets
 */
function containsPotentialSecret(command: string): boolean {
  const secretPatterns = [
    // Long random strings that might be keys
    /[a-zA-Z0-9]{40,}/,
    // JWT tokens
    /eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/,
    // Basic auth headers
    /Basic\s+[a-zA-Z0-9+/]+=*/,
    // AWS keys
    /AKIA[0-9A-Z]{16}/,
    // Common secret variable names with values
    /(api[_-]?key|secret|password|token)\s*=\s*["'][^"']+["']/i,
  ];
  
  return secretPatterns.some(pattern => pattern.test(command));
}

/**
 * Sanitize command output to remove potential secrets
 */
export function sanitizeOutput(output: string): string {
  let sanitized = output;
  
  // Replace potential API keys
  sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '***REDACTED***');
  
  // Replace JWT tokens
  sanitized = sanitized.replace(
    /eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/g,
    '***JWT_REDACTED***'
  );
  
  // Replace basic auth
  sanitized = sanitized.replace(
    /Basic\s+[a-zA-Z0-9+/]+=*/g,
    'Basic ***REDACTED***'
  );
  
  // Replace AWS keys
  sanitized = sanitized.replace(
    /AKIA[0-9A-Z]{16}/g,
    'AKIA***REDACTED***'
  );
  
  // Replace password values
  sanitized = sanitized.replace(
    /(password|passwd|pwd)\s*[:=]\s*["']?[^"'\s]+["']?/gi,
    '$1=***REDACTED***'
  );
  
  // Replace token values
  sanitized = sanitized.replace(
    /(token|api[_-]?key|secret)\s*[:=]\s*["']?[^"'\s]+["']?/gi,
    '$1=***REDACTED***'
  );
  
  return sanitized;
}

/**
 * Log security event
 */
export function logSecurityEvent(event: {
  type: 'blocked' | 'warned' | 'sanitized';
  command?: string;
  reason?: string;
  timestamp?: Date;
}) {
  const logEntry = {
    ...event,
    timestamp: event.timestamp || new Date(),
  };
  
  // In production, this would send to a security monitoring service
  console.log('[SECURITY]', JSON.stringify(logEntry));
}

/**
 * Check if a file path is safe to read
 */
export function isSafeToRead(filePath: string): boolean {
  const forbiddenPaths = [
    /\.env$/,
    /\.env\./,
    /secret/i,
    /credential/i,
    /\.pem$/,
    /\.key$/,
    /\.p12$/,
    /\.pfx$/,
    /id_rsa/,
    /id_dsa/,
    /id_ecdsa/,
    /id_ed25519/,
  ];
  
  return !forbiddenPaths.some(pattern => pattern.test(filePath));
}

/**
 * Validate command against security policy
 */
export async function validateCommand(
  command: string,
  options: {
    requireConfirmation?: (message: string) => Promise<boolean>;
    logEvent?: boolean;
  } = {}
): Promise<{ proceed: boolean; reason?: string }> {
  const check = checkCommand(command);
  
  // Log security event if requested
  if (options.logEvent && !check.allowed) {
    logSecurityEvent({
      type: 'blocked',
      command: command.substring(0, 100), // Truncate for safety
      reason: check.reason,
    });
  }
  
  // Handle forbidden commands
  if (!check.allowed) {
    return { proceed: false, reason: check.reason };
  }
  
  // Handle restricted commands requiring confirmation
  if (check.requiresConfirmation && options.requireConfirmation) {
    const confirmed = await options.requireConfirmation(
      check.confirmationMessage || 'Execute this command?'
    );
    
    if (!confirmed) {
      return { proceed: false, reason: 'User declined confirmation' };
    }
  }
  
  return { proceed: true };
}