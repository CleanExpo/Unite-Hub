// src/lib/businesses.ts
export const BUSINESSES = [
  { key: 'dr',      name: 'Disaster Recovery',     color: '#ef4444', status: 'active'   },
  { key: 'dr_qld',  name: 'Disaster Recovery Qld', color: '#f87171', status: 'active'   },
  { key: 'nrpg',   name: 'NRPG',                  color: '#f97316', status: 'active'   },
  { key: 'carsi',  name: 'CARSI',              color: '#eab308', status: 'active'   },
  { key: 'restore', name: 'RestoreAssist',      color: '#22c55e', status: 'active'   },
  { key: 'synthex', name: 'Synthex',            color: '#a855f7', status: 'active'   },
  { key: 'ato',    name: 'ATO Tax Optimizer',   color: '#3b82f6', status: 'active'   },
  { key: 'ccw',    name: 'CCW-ERP/CRM',         color: '#06b6d4', status: 'active'   },
] as const

export type BusinessKey = typeof BUSINESSES[number]['key']
export type Business = typeof BUSINESSES[number]
