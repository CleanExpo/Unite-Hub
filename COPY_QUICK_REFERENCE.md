# Copy Quick Reference Card

**Keep this open while implementing!** 🚀

---

## Voice Principles (Memorize These)

1. **Clear Over Clever** - No jargon (leverage, utilize, synergize)
2. **Specific Over Generic** - "3x more callbacks" not "better engagement"
3. **Benefit Over Feature** - "No more lost emails" not "email integration"
4. **Action Over Passive** - "Get your team aligned" not "enables collaboration"
5. **Honest Over Hyped** - "40% more callbacks" not "revolutionary AI"

---

## Common Replacements

| ❌ Don't Say | ✅ Do Say |
|--------------|-----------|
| Leverage | Use, Get, Make |
| Utilize | Use |
| Synergize | Work together |
| Orchestrate | Set up, Organize |
| Seamless | Just show it working |
| Platform | App, System, (or just "Unite-Hub") |
| Solution | (the actual thing it does) |
| Actionable insights | What to do next |
| Transform your business | (specific outcome) |
| Engagement metrics | Who opened, who clicked |

---

## Audience Language (Tradies)

| ✅ Use This | ❌ Not This |
|-------------|-------------|
| Callbacks | Conversions, leads |
| Jobs | Revenue opportunities |
| Quotes | Proposals, estimates |
| On the job site | In the field |
| Get you more work | Drive business growth |

---

## Sentence Structure

- **Average length**: 12-15 words
- **Use periods, not commas**: "AI finds hot leads. Scores them. Alerts you." (not "AI finds, scores, and alerts")
- **Active voice**: "You send emails" (not "Emails are sent")
- **Contractions**: "We've" not "We have", "You're" not "You are"

---

## Numbers & Specifics

| ❌ Vague | ✅ Specific |
|----------|-------------|
| "Faster responses" | "3x faster response rate" |
| "Better engagement" | "48% open rate vs 28% average" |
| "Save time" | "Save 5 hours per week" |
| "Quick setup" | "Set up in 5 minutes" |
| "Instant alerts" | "Alerts within 60 seconds" |

---

## Empty State Pattern

```
Icon: 📭 (emoji preferred over icon)
Title: "Your inbox is lonely" (engaging, not "No contacts")
Description: "Connect Gmail and we'll find people who replied. Takes 2 minutes." (benefit + timeframe)
Primary CTA: "Connect Gmail" (specific action)
Secondary Link: "Or add a contact manually" (alternative)
```

---

## Error Message Pattern

```
Title: "Gmail didn't connect" (clear problem)

This usually means:
• Cause 1 → Solution
• Cause 2 → Solution
• Cause 3 → Solution

→ [Primary action]
Still stuck? [Contact option]
```

---

## Success Message Pattern

```
Icon: 🎉 (celebratory emoji)
Title: "Sent to 47 people!" (specific number)
Context: "You'll start seeing opens in 10 minutes." (what happens next)
Action: "View campaign stats →" (next step)
```

---

## Dashboard Stats Pattern

```
Title: "People in your CRM" (not just "Contacts")
Value: "847 contacts"
Context: "12 new this week—up from 8 last week"
Insight: "7 are hot leads right now"
Action: "See hot leads →"
```

---

## CTA Button Copy

| ❌ Generic | ✅ Specific Benefit |
|------------|---------------------|
| "Sign Up Now" | "Find Your Hot Leads" |
| "Learn More" | "See It In Action" |
| "Get Started" | "Start Free Trial" |
| "Submit" | "Save Campaign" |
| "Continue" | "Let's Go" |

---

## Australian English

- **Spelling**: colour, organisation, centre, analyse, licence (noun)
- **Currency**: A$ (not $ or AUD)
- **Phone**: 0400 XXX XXX or 1300 XXX XXX
- **Time**: AEST or AEDT (not EST)

---

## Emoji Usage

Use emoji for empty states and success messages:

| Context | Emoji |
|---------|-------|
| Empty inbox | 📭 |
| Empty campaigns | 📣 |
| No social messages | 🔌 |
| Search no results | 🔍 |
| Empty content drafts | ✍️ |
| All done/completed | ✅ |
| Success | 🎉 |
| Privacy/security | 🔒 |

---

## Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Happy Path | Celebratory | "🎉 Sent! You'll see replies by tomorrow." |
| Error | Helpful | "That didn't work. Check internet and try again." |
| Warning | Serious but kind | "This deletes everything. Export first, just in case." |
| Loading | Honest | "Analyzing 847 emails... Usually takes 30 seconds" |
| Empty State | Encouraging | "Ready to follow up with 10 leads at once?" |

---

## Testing Your Copy

Ask yourself:

1. **5-Second Test**: Can user understand in 5 seconds?
2. **No Jargon**: Would a 45-year-old plumber understand every word?
3. **Specific**: Did I use numbers instead of vague claims?
4. **Action**: Is it active voice ("you do X" not "X is done")?
5. **Mobile**: Do first 10 words make sense on phone screen?
6. **Honest**: Did I avoid over-promising?
7. **Short**: Are sentences under 15 words on average?

---

## Quick Copy Check

Run this on any copy before committing:

```
[ ] No corporate buzzwords (leverage, synergize, etc.)
[ ] Specific numbers used (3x, 60 seconds, 47 people)
[ ] Active voice, not passive
[ ] Short sentences (avg 12-15 words)
[ ] Tradie language (callbacks, jobs, quotes)
[ ] Australian spelling (colour, organisation)
[ ] Contractions used (we've, you're, don't)
[ ] Benefit clear (not just feature description)
```

---

## Common Mistakes to Avoid

1. **Don't use "platform"** → Say "Unite-Hub" or "app"
2. **Don't say "leverage"** → Say "use" or "get"
3. **Don't be vague** → Use specific numbers/timeframes
4. **Don't use passive voice** → Use active ("you send" not "is sent")
5. **Don't over-promise** → Be realistic ("40% more" not "10x more")
6. **Don't use ALL CAPS** → Except for acronyms (AI, CRM, API)
7. **Don't forget emoji** → Use in empty states and success messages

---

## When Stuck, Ask:

1. Would a tradie understand this?
2. Is the benefit crystal clear?
3. Did I state the obvious problem first?
4. Is this shorter than what I started with?
5. Does it sound like a real person talking?

---

## Component Patterns

### EmptyState
```tsx
<EmptyState
  icon="📭"  // emoji string OR LucideIcon
  title="Your inbox is lonely"
  description="Connect Gmail and we'll find replies. Takes 2 minutes."
  actionLabel="Connect Gmail"
  secondaryActionLabel="Or add manually"
  onAction={() => handleConnect()}
  onSecondaryAction={() => handleManual()}
/>
```

### ErrorWithActions
```tsx
<ErrorWithActions
  title="Gmail didn't connect"
  causes={[
    "You clicked 'Deny' by accident → Try again",
    "Password changed → Re-connect",
  ]}
  action={{
    label: "Try connecting again",
    onClick: handleRetry
  }}
  fallback={{
    text: "Still stuck?",
    email: "help@unite-hub.com"
  }}
/>
```

### SuccessWithAction
```tsx
<SuccessWithAction
  icon="🎉"
  title="Sent to 47 people!"
  context="You'll see opens in 10 minutes."
  action={{
    label: "View campaign stats",
    href: `/campaigns/${id}`
  }}
/>
```

### StatWidget
```tsx
<StatWidget
  title="People in your CRM"
  value="847 contacts"
  change="+12 this week"
  context="12 new this week—up from 8 last week"
  insight="7 are hot leads right now"
  actionLink={{
    label: "See hot leads",
    href: "/contacts?filter=hot"
  }}
/>
```

---

## Priority Order

1. **P0** (Do First): Hero section + Empty states
2. **P1** (Do Next): Error messages + Feature cards
3. **P2** (Do Last): Dashboard stats + Onboarding

---

## Questions?

- **Slack**: @rana or @claire
- **Email**: rana@unite-group.in

---

**Print this out and keep it on your desk!** 📄
