# Australian Component Demo

Sample components demonstrating the Unite-Group AI Architecture in action.

## Files Created

### Components
- **`src/components/JobCard.tsx`** - Water damage restoration job card component

### Utilities
- **`src/lib/australian-context.ts`** - Australian context formatting utilities

### Styles
- **`src/styles/design-system.css`** - 2025-2026 design system styles

### Pages
- **`src/app/demo/page.tsx`** - Demo page showcasing components

---

## JobCard Component

A complete example demonstrating all system rules:

### Australian Context ✅

**Spelling (en-AU)**:
- "colour" not "color" (in CSS comments)
- "organisation" not "organization"
- "prioritised" not "prioritized"

**Date Format**:
- DD/MM/YYYY: `08/01/2025`
- Function: `formatDateAU(date)`

**Currency**:
- AUD: `$2,500.00`
- GST: `$250.00` (10%)
- Total: `$2,750.00`
- Function: `formatCurrencyAUD(amount)`

**Phone Numbers**:
- Mobile: `0412 345 678` (04XX XXX XXX)
- Landline: `(02) 1234 5678` ((0X) XXXX XXXX)
- Function: `formatPhoneAU(phone)`

**Address Format**:
- `42 Queen Street, Brisbane City QLD 4000`
- Format: Street, Suburb STATE POSTCODE
- Function: `formatAustralianAddress({street, suburb, state, postcode})`

**Australian States**:
- QLD, NSW, VIC, SA, WA, TAS, NT, ACT
- TypeScript type enforcement

---

### 2025-2026 Design System ✅

**Layout**:
- Bento grid (modular, varying card sizes)
- CSS class: `.bento-grid`

**Surface**:
- Glassmorphism card
- Background: `rgba(255, 255, 255, 0.7)`
- Backdrop blur: `10px`
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- CSS class: `.glass-card`

**Colors**:
- Primary: `#0D9488` (teal)
- Soft colored shadows: `rgba(13, 148, 136, 0.1)`
- NEVER pure black shadows

**Typography**:
- Sans: Inter
- Heading: Cal Sans
- Mono: JetBrains Mono

**Micro-interactions**:
- Hover scale: `1.02`
- Transition: `150ms cubic-bezier(0.4, 0, 0.2, 1)`
- Framer Motion animations

**Icons**:
- ✅ AI-generated custom SVG icons
- ❌ NO Lucide icons
- ❌ NO generic icon libraries

---

### Custom Icons (NO Lucide!) ✅

All icons are custom SVG paths:

```tsx
// Water drop icon (for water damage)
function WaterDropIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

// Calendar icon (for scheduled dates)
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
```

---

## Australian Context Utilities

Complete utility library in `src/lib/australian-context.ts`:

### Date Functions
- `formatDateAU(date)` → `"05/01/2025"`
- `formatDateTimeAU(date)` → `"05/01/2025, 2:30 pm"`

### Currency Functions
- `formatCurrencyAUD(amount)` → `"$1,234.56"`
- `calculateGST(amount)` → `amount * 0.10`
- `calculateTotalWithGST(amount)` → `amount + GST`

### Phone Functions
- `formatPhoneAU(phone)` → `"0412 345 678"` or `"(02) 1234 5678"`
- `isValidAustralianMobile(phone)` → `boolean`
- `isValidAustralianLandline(phone)` → `boolean`
- `isValidAustralianPhone(phone)` → `boolean`

### Address Functions
- `formatPostcode(code)` → `"4000"` (4 digits)
- `isValidPostcode(code)` → `boolean`
- `getStateName(code)` → `"Queensland"`
- `getAustralianTimezone(state)` → `"Australia/Brisbane"`
- `formatAustralianAddress({...})` → `"Street, Suburb STATE POSTCODE"`

### Business Functions
- `formatABN(abn)` → `"12 345 678 901"`
- `validateABN(abn)` → `boolean` (with checksum)
- `formatACN(acn)` → `"123 456 789"`
- `validateACN(acn)` → `boolean`

---

## Design System Styles

Complete CSS in `src/styles/design-system.css`:

### Glassmorphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(13, 148, 136, 0.1); /* Soft colored shadow */
}
```

### Bento Grid
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
```

### Buttons
```css
.btn-primary {
  background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);
}
```

### Micro-interactions
```css
.hover-scale:hover {
  transform: scale(1.02);
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## System Enforcement Demonstrated

### Pre-response Hook ✅
- Automatically loads `australian-context.skill.md`
- Ensures all dates, currency, phone numbers use Australian format

### Design System Skill ✅
- Enforces NO Lucide icons (custom SVG only)
- Validates against `design-tokens.json`
- Ensures 2025-2026 aesthetic (Bento grids, glassmorphism)

### Verification First ✅
- Component is properly typed (TypeScript)
- All functions have clear return types
- Validation functions provided

---

## Usage

### View Demo Page

```bash
pnpm dev
# Navigate to http://localhost:3000/demo
```

### Use JobCard Component

```tsx
import { JobCard } from '@/components/JobCard';

const job = {
  id: 'JOB-2025-0142',
  customerName: 'Sarah Thompson',
  customerPhone: '0412345678',
  address: '42 Queen Street',
  suburb: 'Brisbane City',
  state: 'QLD',
  postcode: '4000',
  jobType: 'Water Damage Restoration',
  status: 'scheduled',
  amount: 2500.00,
  gst: 250.00,
  scheduledDate: new Date('2025-01-08'),
  createdAt: new Date('2025-01-05'),
};

<JobCard job={job} />
```

### Use Australian Utilities

```tsx
import {
  formatDateAU,
  formatCurrencyAUD,
  formatPhoneAU,
  calculateGST,
  validateABN
} from '@/lib/australian-context';

// Dates
formatDateAU(new Date('2025-01-08')) // "08/01/2025"

// Currency
formatCurrencyAUD(2500.00) // "$2,500.00"
calculateGST(2500.00) // 250.00

// Phone
formatPhoneAU('0412345678') // "0412 345 678"

// ABN
validateABN('12345678901') // true/false (with checksum)
```

---

## Verification Checklist

Before deployment, verify:

- [x] ✅ All dates in DD/MM/YYYY format
- [x] ✅ All currency in AUD with GST
- [x] ✅ All phone numbers formatted as 04XX XXX XXX
- [x] ✅ All addresses as Street, Suburb STATE POSTCODE
- [x] ✅ NO Lucide icons used (custom SVG only)
- [x] ✅ Glassmorphism cards with soft colored shadows
- [x] ✅ Bento grid layout
- [x] ✅ Micro-interactions (hover scale 1.02)
- [x] ✅ Primary color #0D9488 (teal)
- [x] ✅ TypeScript types for Australian states
- [x] ✅ ABN/ACN validation with checksum

---

## Skills Demonstrated

| Skill | Used | Evidence |
|-------|------|----------|
| **australian-context.skill.md** | ✅ | DD/MM/YYYY dates, AUD currency, 04XX XXX XXX phone |
| **design-system.skill.md** | ✅ | Glassmorphism, Bento grid, NO Lucide, soft shadows |
| **nextjs.skill.md** | ✅ | Next.js 15 App Router, Server/Client components |
| **verification-first.skill.md** | ✅ | TypeScript types, validation functions |

---

## Hooks That Would Fire

| Hook | When | Action |
|------|------|--------|
| **pre-response.hook** | On page load | Load australian-context.skill.md |
| **pre-publish.hook** | Before content goes live | Verify any claims with Truth Finder |
| **pre-deploy.hook** | Before deployment | E2E tests, Lighthouse >90, security scan |
| **post-code.hook** | After generation | Type check, lint |

---

## Next Steps

1. **Add More Components**:
   - InvoiceCard (with ABN, GST breakdown)
   - CustomerForm (with Australian validation)
   - LocationMap (Australian cities)

2. **Enhance Utilities**:
   - Add TFN (Tax File Number) formatting
   - Add Medicare number formatting
   - Add driver licence validation (state-specific)

3. **Create Storybook**:
   - Document all components
   - Show all Australian context variations
   - Demonstrate all micro-interactions

4. **Build Component Library**:
   - Package Australian utilities
   - Export design system
   - Publish to npm

---

🦘 **Australian-first. Truth-first. SEO-dominant. Design-forward.**

*All components enforce Unite-Group AI Architecture standards*
