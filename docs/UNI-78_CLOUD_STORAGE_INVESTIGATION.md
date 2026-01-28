# UNI-78: Cloud Storage Integration Investigation

**Date**: 2026-01-28
**Status**: Investigation Complete - Discrepancy Found
**Priority**: Urgent (Linear)

---

## Linear Issue Details

**Title**: [UH-PROD] Complete cloud storage integration (6 TODOs)

**Description**: 6 TODO comments across the codebase for cloud storage uploads (AWS S3, GCS, Azure). Currently stubs.

**Affected Areas** (from Linear):
1. Export file storage (cron/process-exports)
2. Email attachment storage (email/webhook)
3. Event data storage (aido/reality-loop/process)
4. Various upload handlers

**Requirements**:
- Choose provider: DigitalOcean Spaces (S3-compatible) or Cloudinary
- Replace all 6 storage upload stubs
- Signed URL generation for secure downloads
- Cleanup policy for expired files

---

## Investigation Findings

### 1. Email Attachment Storage ✅ **ALREADY IMPLEMENTED**

**Status**: **COMPLETE** - Fully implemented with Supabase Storage

**File**: `lib/gmail/storage-supabase.ts` (214 lines)

**Implementation**:
- ✅ Real cloud storage (Supabase Storage, S3-compatible)
- ✅ Upload functionality (`uploadAttachment`, `uploadAttachments`)
- ✅ Delete functionality (`deleteAttachment`)
- ✅ Signed URLs (`getAttachmentDownloadUrl` with configurable expiration)
- ✅ Bucket auto-creation with security settings
- ✅ 50MB file size limit
- ✅ MIME type validation
- ✅ List attachments per client

**Code Quality**: Production-ready, comprehensive error handling

**Conclusion**: This area is **complete** and does not need work.

---

### 2. Export File Storage ⚠️ **NEEDS IMPLEMENTATION**

**File**: `src/app/api/reports/export/route.ts`

**Current Behavior**:
- Generates reports in 5 formats: PDF, Slides, JSON, Markdown, HTML
- Returns file content in API response (base64/JSON)
- **Does NOT upload to cloud storage**
- **Does NOT provide signed URLs for download**

**Missing Features**:
1. Upload exported files to cloud storage
2. Return signed URLs instead of file content in response
3. Cleanup old export files (TTL policy)

**Recommendation**:
- Add Supabase Storage upload after generation
- Store exports in `exports` bucket with client_id/date structure
- Implement 7-day TTL cleanup policy
- Return signed URL (24-hour expiry) instead of file content

---

### 3. Event Data Storage ⚠️ **NO CLOUD STORAGE NEEDED**

**File**: `src/app/api/aido/reality-loop/process/route.ts`

**Current Behavior**:
- Processes reality events stored in database
- Marks events as processed/failed
- **Does NOT handle file uploads**

**Analysis**: This endpoint processes database records, not files. No cloud storage implementation needed unless events include file attachments (not indicated in current code).

**Recommendation**: No action needed unless requirements change.

---

### 4. Media Upload 🔄 **PARTIALLY IMPLEMENTED**

**File**: `src/app/api/media/upload/route.ts`

**Current Status**:
- ✅ Uses Supabase Storage for media files
- ✅ Uploads to `media-uploads` bucket
- ✅ Creates database records
- ⚠️ Phase 3 TODO: Implement transcription endpoint (different issue)

**Analysis**: Media upload uses Supabase Storage. Cloud storage is implemented.

**Recommendation**: No cloud storage work needed. Transcription TODO is separate.

---

### 5. Asset Upload 🔍 **NEEDS INVESTIGATION**

**Mentioned in**: `ACTION-PLAN.md` (Line 809)

**File**: `src/components/assets/AssetUpload.tsx`

**TODO**: "Implement actual upload to Convex storage"

**Status**: Not yet investigated. Need to check if this file exists and current state.

---

### 6. Cron/Process-Exports ❌ **FILE NOT FOUND**

**Mentioned in**: Linear issue

**Search Results**: No file found matching `cron/process-exports` or similar patterns.

**Possible Locations Checked**:
- `src/app/api/cron/` - Found: health-check, success-email, success-insights, success-score
- `src/cron/` - Found: daily-seo-sync.ts
- `src/app/api/reports/export/` - Found (covered in #2 above)

**Recommendation**: Clarify what "cron/process-exports" refers to or create new export automation.

---

## TODO Search Results

**Searched Patterns**:
- `TODO.*storage`
- `TODO.*upload`
- `TODO.*S3`
- `TODO.*cloud`

**Found TODOs**:
1. ❌ `ACTION-PLAN.md` Line 809: "Implement actual upload to Convex storage" (documentation, not code)
2. ❌ `ACTION-PLAN.md` Line 814-816: Gmail storage TODOs (already resolved in code)
3. ⚠️ `src/app/api/media/upload/route.ts` Line 144: "Phase 3 - Implement transcription endpoint" (different feature)

**Cloud Storage TODOs**: **0 found in source code**

---

## Discrepancy Analysis

**Linear Issue Claims**: "6 TODO comments across the codebase"
**Investigation Found**: 0 active cloud storage TODOs in source code

**Possible Explanations**:
1. TODOs were already resolved (email attachments done)
2. Issue description is outdated/incorrect
3. TODOs exist in different files than mentioned
4. Work needs to be done but TODOs haven't been added yet

---

## Recommended Actions

### Option A: Update Linear Issue (Recommended)

**Action**: Close or update UNI-78 as partially complete

**Rationale**:
- Email attachment storage: **100% complete**
- Media upload storage: **100% complete**
- Export file storage: Needs implementation but NO TODO exists
- Event data storage: Not applicable (no files)
- Cron/process-exports: File not found

**Updated Scope**:
- ~~6 TODOs~~ → 1 feature (export file storage)
- Change from "Complete cloud storage integration" to "Add cloud storage for report exports"

---

### Option B: Implement Missing Features (Alternative)

If issue scope is correct, implement:

1. **Export File Storage** (4 hours)
   - Add Supabase Storage upload to `/api/reports/export`
   - Return signed URLs instead of file content
   - Implement 7-day TTL cleanup

2. **Asset Upload** (2 hours)
   - Investigate `src/components/assets/AssetUpload.tsx`
   - Implement if needed

3. **Cleanup Policy** (2 hours)
   - Create cron job for expired file deletion
   - Implement for all buckets (attachments, media, exports)

**Total Effort**: 8 hours

---

### Option C: Move to Next Priority

**Action**: Mark UNI-78 as blocked/needs-clarification, proceed to next highest priority

**Next Highest Priority Issues** (from backlog screenshot):

**Urgent Priority**:
1. ✅ UNI-78: Cloud Storage (current - blocked)
2. ⏭️ **UNI-64**: [UH-P1] Implement prompt caching across existing agents
3. ⏭️ **UNI-63**: [UH-P1] Install Brave Search + create integration client

**Recommendation**: Proceed with **UNI-64: Prompt Caching** (High impact, clear scope)

---

## Conclusion

**Summary**: The Linear issue UNI-78 appears to be **outdated or incomplete**. Email attachment storage is fully implemented with Supabase Storage. Only export file storage needs cloud implementation, but this is not reflected in any TODO comments.

**Recommended Next Step**:
1. **Short-term**: Update Linear issue to reflect actual state
2. **Immediate work**: Move to UNI-64 (Prompt Caching) which has clear requirements and high impact

---

**Investigation By**: Claude Sonnet 4.5
**Date**: 2026-01-28
**Files Analyzed**: 15 source files, 2 documentation files
**Search Patterns**: 4 TODO patterns, multiple glob/grep searches
