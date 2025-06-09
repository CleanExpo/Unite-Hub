# Build Error Fix Tasks

## Identified Build Errors

### 1. CookieConsentProvider Import Error
- **File**: `src/app/account/privacy/page.tsx`
- **Error**: Module not found for path `../../../../components/compliance/CookieConsentProvider`
- **Fix**: Update import path to use @ alias

### 2. MFASetup Component Missing
- **File**: `src/app/account/security/page.tsx`
- **Error**: Module not found for `../../../../components/auth/MFASetup`
- **Fix**: Create the MFASetup component

### 3. Site Health Page Errors
- **File**: `src/app/admin/site-health/page.tsx`
- **Errors**: 
  - SSR false not allowed in Server Components
  - Syntax error in import statement (extra quote)
- **Fix**: Add 'use client' directive and fix import syntax

### 4. Missing CSS File
- **File**: `src/app/page.tsx`
- **Error**: Module not found for `../../styles/animations.css`
- **Fix**: Create the animations.css file

## Implementation Order
1. First, check and fix the import paths
2. Create missing components
3. Fix SSR issues
4. Create missing CSS file
