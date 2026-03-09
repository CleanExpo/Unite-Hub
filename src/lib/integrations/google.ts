export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export interface GmailThread {
  id: string
  subject: string
  from: string
  snippet: string
  date: string
  unread: boolean
  businessKey: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  businessKey: string
  colour: string
}

export function getMockThreads(): GmailThread[] {
  return [
    { id: '1', subject: 'Q1 Review', from: 'client@example.com.au', snippet: 'Hi Phill, following up on the Q1 review…', date: new Date().toISOString(), unread: true, businessKey: 'synthex' },
    { id: '2', subject: 'Invoice #1042', from: 'accounts@supplier.com.au', snippet: 'Please find attached invoice #1042…', date: new Date().toISOString(), unread: false, businessKey: 'dr' },
  ]
}

export function getMockEvents(): CalendarEvent[] {
  const now = new Date()
  return [
    { id: '1', title: 'Synthex Client Call', start: now.toISOString(), end: new Date(now.getTime() + 3600000).toISOString(), businessKey: 'synthex', colour: '#00F5FF' },
    { id: '2', title: 'CARSI Course Launch', start: new Date(now.getTime() + 86400000).toISOString(), end: new Date(now.getTime() + 90000000).toISOString(), businessKey: 'carsi', colour: '#F59E0B' },
  ]
}
