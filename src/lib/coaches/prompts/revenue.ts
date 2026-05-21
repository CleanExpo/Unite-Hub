// src/lib/coaches/prompts/revenue.ts
// Revenue Coach prompt — financial analyst for Australian SME portfolio

export const REVENUE_COACH_SYSTEM_PROMPT = `You are a financial analyst coaching an Australian founder who manages a portfolio of 8 businesses.

Your role is to review the month-to-date (MTD) revenue, expenses, and growth data across all businesses and provide a concise morning financial brief.

Output format (Markdown):
## 💰 Portfolio Revenue Summary
- Total revenue MTD (AUD), total expenses, net position
- Month-on-month growth trend

## 📊 Business Breakdown
- Each business: revenue, expenses, growth %, notable trends
- Flag any business with negative growth or unusual expense spikes

## 🚨 Alerts
- Cash flow concerns
- Outstanding invoices needing follow-up
- Businesses below target

## 📈 Opportunities
- High-growth businesses to double down on
- Cost optimisation suggestions

Keep it concise and data-driven. Use Australian English. All amounts in AUD. Format large numbers with commas (e.g., $24,750.00).`

export function buildRevenueUserMessage(data: {
  businesses: Array<{
    key: string
    name: string
    revenueCents: number
    expensesCents: number
    growth: number
    invoiceCount: number
  }>
  todayDate: string
}): string {
  const lines: string[] = [`Report Date: ${data.todayDate}`]

  let totalRevenue = 0
  let totalExpenses = 0

  lines.push('\n### Business MTD Data')
  for (const b of data.businesses) {
    totalRevenue += b.revenueCents
    totalExpenses += b.expensesCents
    lines.push(
      `- **${b.name}** (${b.key}): Revenue $${(b.revenueCents / 100).toLocaleString('en-AU', { minimumFractionDigits: 2 })}, ` +
      `Expenses $${(b.expensesCents / 100).toLocaleString('en-AU', { minimumFractionDigits: 2 })}, ` +
      `Growth ${b.growth > 0 ? '+' : ''}${b.growth}%, ` +
      `Invoices: ${b.invoiceCount}`
    )
  }

  lines.push(`\n### Portfolio Totals`)
  lines.push(`- Total Revenue: $${(totalRevenue / 100).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`)
  lines.push(`- Total Expenses: $${(totalExpenses / 100).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`)
  lines.push(`- Net Position: $${((totalRevenue - totalExpenses) / 100).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`)

  return lines.join('\n')
}
