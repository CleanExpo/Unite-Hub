# ⚠️ STRIPE KEY VALIDATION GUIDE - PREVENT CONFUSION

## YOUR CORRECT STRIPE KEYS

### ✅ CORRECT CONFIGURATION:
```env
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Gx5IrHjjUzwIJDNUlnkyODSG4xOzdGRj6RzQctaAJFe0MVhD6NaXMLIqYCAvRzDBeRrFzp3yyRgGV6CblPnpUIT00frcmDwO7
STRIPE_WEBHOOK_SECRET=whsec_2zscv88gTrul2bnrLrNbRab4m8iCqwoF
```

## HOW TO IDENTIFY STRIPE KEYS

### Secret Key (Backend Only)
- **Starts with**: `sk_live_` (production) or `sk_test_` (testing)
- **Used for**: Server-side API calls only
- **Security**: NEVER expose in client code or commit to git
- **Your key**: `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`

### Publishable Key (Frontend Safe)
- **Starts with**: `pk_live_` (production) or `pk_test_` (testing)
- **Used for**: Client-side Stripe.js integration
- **Security**: Safe to expose in browser
- **Your key**: `pk_live_51Gx5IrHjjUzwIJDNUlnkyODSG4xOzdGRj6RzQctaAJFe0MVhD6NaXMLIqYCAvRzDBeRrFzp3yyRgGV6CblPnpUIT00frcmDwO7`

## VALIDATION CHECKLIST

Before deploying, always verify:

1. ✅ `STRIPE_SECRET_KEY` starts with `sk_` (NOT `pk_`)
2. ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_` (NOT `sk_`)
3. ✅ Both keys are for the same mode (both `live` or both `test`)
4. ✅ Keys are in the correct environment variables

## COMMON MISTAKES TO AVOID

### ❌ WRONG - Using publishable key as secret key:
```env
STRIPE_SECRET_KEY=pk_live_... # WRONG! This should start with sk_
```

### ❌ WRONG - Using secret key as publishable key:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sk_live_... # WRONG! This should start with pk_
```

### ❌ WRONG - Mixing test and live keys:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # WRONG! Both should be same mode
```

## QUICK VALIDATION SCRIPT

Run this in your terminal to validate your keys:

```bash
# Check if keys are set correctly
if [[ $STRIPE_SECRET_KEY == sk_* ]]; then
  echo "✅ Secret key format is correct"
else
  echo "❌ ERROR: STRIPE_SECRET_KEY should start with sk_"
fi

if [[ $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY == pk_* ]]; then
  echo "✅ Publishable key format is correct"
else
  echo "❌ ERROR: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should start with pk_"
fi
```

## WHERE TO UPDATE KEYS

1. **Local Development**: `.env.local`
2. **Production (Vercel)**: Dashboard → Settings → Environment Variables
3. **Reference**: `.env.example` (now contains your correct keys)

## PERMANENT FIX APPLIED

I've updated `.env.example` with:
- Clear warnings and explanations
- Your correct keys already filled in
- Detailed comments preventing confusion

This should prevent any future mix-ups! 🎯
