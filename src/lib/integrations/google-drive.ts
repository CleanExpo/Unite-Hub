import { getCached, setCache, invalidateCache } from '@/lib/cache'

const GOOGLE_DRIVE_CACHE_TTL_MS = 5 * 60 * 1_000

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink: string
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_VAULT_FOLDER_ID
  )
}

async function listFolderContents(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and mimeType='text/markdown' and trashed=false`
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=100&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return []
  const data = await res.json() as { files?: DriveFile[] }
  return (data.files ?? []).sort((a, b) =>
    new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
  )
}

async function getFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return ''
  return res.text()
}

export async function getVaultFiles(founderId: string): Promise<DriveFile[]> {
  if (!isGoogleDriveConfigured()) return []

  const cacheKey = `drive-vault:${founderId}`
  const cached = getCached<DriveFile[]>(cacheKey)
  if (cached) return cached

  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')
  const { getValidToken } = await import('@/lib/integrations/google')

  const supabase = createServiceClient()
  const { data: vaultRows } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt')
    .eq('founder_id', founderId)
    .eq('service', 'google')
    .limit(1)

  if (!vaultRows?.length) return []

  try {
    const tokens = JSON.parse(
      decrypt({
        encryptedValue: vaultRows[0].encrypted_value,
        iv: vaultRows[0].iv,
        salt: vaultRows[0].salt,
      })
    )
    const accessToken = await getValidToken(tokens)
    const files = await listFolderContents(
      accessToken,
      process.env.GOOGLE_DRIVE_VAULT_FOLDER_ID!
    )
    setCache(cacheKey, files, GOOGLE_DRIVE_CACHE_TTL_MS)
    return files
  } catch {
    return []
  }
}

export async function getVaultFileContent(
  founderId: string,
  fileId: string
): Promise<string> {
  if (!isGoogleDriveConfigured()) return ''

  const cacheKey = `drive-content:${fileId}`
  const cached = getCached<string>(cacheKey)
  if (cached) return cached

  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')
  const { getValidToken } = await import('@/lib/integrations/google')

  const supabase = createServiceClient()
  const { data: vaultRows } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt')
    .eq('founder_id', founderId)
    .eq('service', 'google')
    .limit(1)

  if (!vaultRows?.length) return ''

  try {
    const tokens = JSON.parse(
      decrypt({
        encryptedValue: vaultRows[0].encrypted_value,
        iv: vaultRows[0].iv,
        salt: vaultRows[0].salt,
      })
    )
    const accessToken = await getValidToken(tokens)
    const content = await getFileContent(accessToken, fileId)
    setCache(cacheKey, content, GOOGLE_DRIVE_CACHE_TTL_MS)
    return content
  } catch {
    return ''
  }
}

export function invalidateVaultCache(founderId: string): void {
  invalidateCache(`drive-vault:${founderId}`)
}
