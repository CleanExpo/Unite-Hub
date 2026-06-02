export type PrivateAccessUser = {
  id?: string | null
  email?: string | null
}

function parseAllowList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function getPrivateAccessConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    allowedUserIds: parseAllowList(env.FOUNDER_ALLOWED_USER_IDS ?? env.FOUNDER_USER_ID),
    allowedEmails: parseAllowList(env.FOUNDER_ALLOWED_EMAILS ?? env.ALLOWED_FOUNDER_EMAILS),
  }
}

export function isPrivateAccessConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const config = getPrivateAccessConfig(env)
  return config.allowedUserIds.length > 0 || config.allowedEmails.length > 0
}

export function hasPrivateAccess(
  user: PrivateAccessUser | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const config = getPrivateAccessConfig(env)

  // Fail-open only until the founder allow-list is configured. This prevents an
  // accidental production lockout during deployment, while still allowing Vercel
  // to become locked/private as soon as FOUNDER_USER_ID or FOUNDER_ALLOWED_* is set.
  if (config.allowedUserIds.length === 0 && config.allowedEmails.length === 0) {
    return true
  }

  const userId = user?.id?.trim().toLowerCase()
  const email = user?.email?.trim().toLowerCase()

  return Boolean(
    (userId && config.allowedUserIds.includes(userId))
    || (email && config.allowedEmails.includes(email)),
  )
}
