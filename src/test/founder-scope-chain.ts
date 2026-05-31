// Test-only Supabase query-builder mock for asserting founder-scoped mutations.
//
// Each `.update()` call returns an ISOLATED sub-chain that records its own
// `.eq()` / `.in()` arguments. This lets a test assert that EVERY mutation
// issued during a request carries an explicit `.eq('founder_id', user.id)`
// filter — independent of any preceding ownership-guard `.select(...)` that
// also filters by founder_id (which would otherwise mask an unscoped update).

import { vi } from 'vitest'

type Result = { data?: unknown; error: unknown }
type Resolve = (value: unknown) => unknown

export interface ServiceChain {
  /** One record per `.update()` invocation, holding that mutation's filter args. */
  updateChains: Array<{ eqArgs: unknown[][] }>
  [key: string]: unknown
}

/**
 * Build a chainable mock. `results` is the ordered queue consumed by terminal
 * operations (`.single()`, `.maybeSingle()`, and thenable `await`) in execution
 * order. When the queue is exhausted, terminals resolve `{ data: null, error: null }`.
 */
export function makeServiceChain(results: Result[] = []): ServiceChain {
  const queue = [...results]
  const next = (): Result => (queue.length ? queue.shift()! : { data: null, error: null })

  const updateChains: Array<{ eqArgs: unknown[][] }> = []
  const chain: ServiceChain = { updateChains }

  chain.from = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.upsert = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve(next()))
  chain.maybeSingle = vi.fn(() => Promise.resolve(next()))
  chain.then = (resolve: Resolve) => resolve(next())

  chain.update = vi.fn(() => {
    const rec = { eqArgs: [] as unknown[][] }
    updateChains.push(rec)
    const sub: Record<string, unknown> = {}
    sub.eq = vi.fn((...args: unknown[]) => {
      rec.eqArgs.push(args)
      return sub
    })
    sub.in = vi.fn(() => sub)
    sub.select = vi.fn(() => sub)
    sub.single = vi.fn(() => Promise.resolve(next()))
    sub.then = (resolve: Resolve) => resolve(next())
    return sub
  })

  return chain
}

/**
 * True iff at least one mutation ran and EVERY `.update()` issued during the
 * request was filtered by `.eq('founder_id', userId)`.
 */
export function everyUpdateFounderScoped(chain: ServiceChain, userId: string): boolean {
  const ucs = chain.updateChains
  return (
    ucs.length > 0 &&
    ucs.every((uc) => uc.eqArgs.some((args) => args[0] === 'founder_id' && args[1] === userId))
  )
}
