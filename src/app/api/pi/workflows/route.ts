import { readFile } from 'node:fs/promises'
import * as path from 'node:path'
import { NextResponse } from 'next/server'
import {
  buildPiDevOpsWorkflowState,
  type PiDevOpsWorkflowEvidence,
  type PiDevOpsWorkflowManifest,
} from '../../../../lib/founder-os/pi-dev-ops-workflows'

export const dynamic = 'force-dynamic'

const WORKFLOW_DIR = path.join(process.cwd(), '.pi', 'dev-ops', 'dynamic-workflows')
const MANIFEST_PATH = path.join(WORKFLOW_DIR, 'manifest.template.json')
const EVIDENCE_PATH = path.join(WORKFLOW_DIR, 'evidence.pathway.json')

export async function GET() {
  try {
    const [manifest, evidence] = await Promise.all([
      readJson<PiDevOpsWorkflowManifest>(MANIFEST_PATH),
      readJson<PiDevOpsWorkflowEvidence>(EVIDENCE_PATH),
    ])

    return NextResponse.json({
      workflow: buildPiDevOpsWorkflowState({ manifest, evidence }),
      source: {
        manifestPath: '.pi/dev-ops/dynamic-workflows/manifest.template.json',
        evidencePath: '.pi/dev-ops/dynamic-workflows/evidence.pathway.json',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unable to load Pi-Dev-Ops workflow evidence',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}
