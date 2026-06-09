import { describe, it, expect, vi } from 'vitest'
import {
  changeBinding,
  subscribeToQueue,
  CC_REALTIME_CHANNEL,
  CC_REALTIME_TABLES,
  type RealtimeChannelLike,
  type RealtimeClientLike,
} from '@/lib/command-centre/realtime'

describe('changeBinding', () => {
  it('binds all events on a public table', () => {
    expect(changeBinding('cc_tasks')).toEqual({ event: '*', schema: 'public', table: 'cc_tasks' })
  })
})

describe('CC_REALTIME_TABLES', () => {
  it('covers the queue-driving tables', () => {
    expect(CC_REALTIME_TABLES).toContain('cc_tasks')
    expect(CC_REALTIME_TABLES).toContain('cc_execution_sessions')
  })
})

function makeMockClient() {
  const bindings: Array<{ table: string }> = []
  let subscribed = false
  let removed = false
  const triggers: Array<(p: unknown) => void> = []
  const channel: RealtimeChannelLike = {
    on(_type, config, cb) {
      bindings.push({ table: config.table })
      triggers.push(cb)
      return channel
    },
    subscribe(cb) {
      subscribed = true
      cb?.('SUBSCRIBED')
      return channel
    },
  }
  const client: RealtimeClientLike = {
    channel: vi.fn(() => channel),
    removeChannel: () => { removed = true },
  }
  return { client, channel, bindings, triggers, isSubscribed: () => subscribed, isRemoved: () => removed }
}

describe('subscribeToQueue', () => {
  it('opens the cc:queue channel and binds every realtime table', () => {
    const m = makeMockClient()
    subscribeToQueue(m.client, () => {})
    expect(m.client.channel).toHaveBeenCalledWith(CC_REALTIME_CHANNEL)
    expect(m.bindings.map((b) => b.table).sort()).toEqual([...CC_REALTIME_TABLES].sort())
    expect(m.isSubscribed()).toBe(true)
  })

  it('invokes onChange with the table when an event fires', () => {
    const m = makeMockClient()
    const onChange = vi.fn()
    subscribeToQueue(m.client, onChange)
    m.triggers[0]({}) // simulate a change on the first bound table
    expect(onChange).toHaveBeenCalledWith(CC_REALTIME_TABLES[0])
  })

  it('relays subscription status and returns an unsubscribe that removes the channel', () => {
    const m = makeMockClient()
    const onStatus = vi.fn()
    const unsub = subscribeToQueue(m.client, () => {}, onStatus)
    expect(onStatus).toHaveBeenCalledWith('SUBSCRIBED')
    unsub()
    expect(m.isRemoved()).toBe(true)
  })
})
