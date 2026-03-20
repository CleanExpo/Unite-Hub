# Slop Prevention Protocol

> **Purpose**: Enforce output quality. Eliminate filler, hallucination, and low-signal content.
> **Authority**: Active for all modes. Non-negotiable.

---

## Slop Indicators (Reject on Sight)

### Filler Text
- "It's important to note that..." — delete, lead with the fact
- "As mentioned earlier..." — delete, the reader can scroll
- "In order to..." — replace with "To..."
- "It should be noted that..." — delete, just state it
- "At the end of the day..." — delete entirely
- "Let me explain..." — delete, just explain
- "Basically..." / "Essentially..." — delete, be precise
- "Going forward..." — delete or replace with specific timeframe

### Unnecessary Caveats
- "This may vary depending on your use case" — remove unless genuinely ambiguous
- "There are many ways to do this, but..." — pick the best one and state it
- "It depends..." without specifying what it depends on — specify or remove
- "Results may vary" — remove unless discussing actual variability

### Restatement of Obvious Facts
- Restating what the user just said back to them
- Summarising what you just did at the end of a response
- Explaining what a function does when the name is self-documenting
- Describing the purpose of a file that has a clear name

### Hallucinated Content
- File paths that haven't been verified with Glob/Read
- API endpoints assumed but not confirmed
- Package features not verified against documentation
- Database columns guessed from convention

---

## Australian English Enforcement

All output MUST use Australian English. This is centralised here as the canonical rule.

### Spelling
| Correct (en-AU) | Incorrect (en-US) |
|-----------------|-------------------|
| colour | color |
| behaviour | behavior |
| optimisation | optimization |
| analyse | analyze |
| centre | center |
| licence (noun) | license (noun) |
| defence | defense |
| organisation | organization |
| prioritise | prioritize |
| customise | customize |
| recognise | recognize |
| categorise | categorize |
| metre (unit) | meter (unit) |
| catalogue | catalog |
| programme (plan) | program (plan) |
| practise (verb) | practice (verb) |

### Conventions
- **Dates**: DD/MM/YYYY (e.g., 20/03/2026)
- **Times**: 12-hour with am/pm (e.g., 2:30 pm AEST)
- **Currency**: AUD, formatted as $1,234.56
- **Phone**: 04XX XXX XXX (mobile), (0X) XXXX XXXX (landline)
- **Addresses**: Street, Suburb STATE POSTCODE (e.g., 42 Queen Street, Brisbane City QLD 4000)

---

## Output Quality Gates

### Gate 1: No Hallucinated Paths
Every file path, import, or reference in output must be:
- Confirmed by a prior Read/Glob/Grep, OR
- Explicitly stated as assumed (with verification action noted)

**Fail condition**: Referencing a file/module/function that doesn't exist.

### Gate 2: No Invented APIs
Every API call, endpoint, or SDK method must be:
- Confirmed from codebase or documentation, OR
- Explicitly marked as "needs verification"

**Fail condition**: Using an API method that doesn't exist or has incorrect parameters.

### Gate 3: No Filler
Responses must be direct and actionable:
- Lead with the answer or action, not the reasoning
- Skip preamble — the user already knows what they asked
- No trailing summaries — the diff speaks for itself
- No unnecessary transitions between sections

**Fail condition**: More than 20% of response is non-actionable text.

### Gate 4: No Stale References
When citing a previous decision, memory, or convention:
- Verify it still applies (files change, decisions get reversed)
- Check the source is current, not from a stale cache

**Fail condition**: Acting on outdated information when current state differs.

---

## Response Compression Rules

1. **One sentence beats three** — if the information fits in one sentence, use one sentence
2. **Code over prose** — show the implementation, not a description of it
3. **Diff over full file** — use Edit, not Write, for modifications
4. **Action over explanation** — do the thing, explain only if non-obvious
5. **Specific over general** — name the file, line, function — not "the relevant code"

---

## Exceptions

Slop prevention relaxes in these contexts:
- **PLAN mode**: Longer analysis is expected and valuable
- **EXPLORE mode**: Educational explanations are the point
- **User explicitly asks for detail**: "Explain in depth", "walk me through this"
- **Complex trade-off analysis**: Multiple options require thorough comparison

Even in these cases, filler text and hallucinated content remain prohibited.
