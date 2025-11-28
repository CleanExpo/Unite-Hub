# Founder OS - Production QA Checklist

**Generated**: 2025-11-28
**Version**: 1.0.0
**Status**: Client-In-The-Loop Activated

---

## 1. Client-In-The-Loop Approvals

### Test: Submit a test approval
- [ ] Navigate to any SEO/content tool that has ApprovalAutoButton
- [ ] Click "Submit for Client Approval"
- [ ] Select explanation mode (ELI5/Beginner/Technical/Founder)
- [ ] Verify toast notification appears

### Test: Review in Founder dashboard
- [ ] Navigate to `/founder/approvals`
- [ ] Verify approval appears in list
- [ ] Verify status shows "Pending Review"
- [ ] Expand raw data payload
- [ ] Expand strategy options (4 paths visible)

### Test: Approve/Reject/Request Changes
- [ ] Click "Approve & Queue for Execution"
- [ ] Verify status changes to "Approved"
- [ ] Submit another approval
- [ ] Click "Request Changes"
- [ ] Verify status changes to "Needs Changes"
- [ ] Submit another approval
- [ ] Click "Reject"
- [ ] Verify status changes to "Rejected"

---

## 2. Blue Ocean Strategy Engine

### Test: ERRC Framework Generation
- [ ] Verify strategy_options in approval includes:
  - `eliminate[]` - factors to eliminate
  - `reduce[]` - factors to reduce
  - `raise[]` - factors to raise
  - `create_items[]` - factors to create
- [ ] Verify strategic_canvas object present
- [ ] Verify opportunities array populated

### Test: 4-Path Strategy Options
- [ ] Verify `conservative` path present with:
  - label, description, risk_level, estimated_impact, actions[]
- [ ] Verify `aggressive` path present
- [ ] Verify `blue_ocean` path present with ERRC framework
- [ ] Verify `data_driven` path present

---

## 3. AI Consultation Engine

### Test: Start a new session
- [ ] Navigate to `/client/ai-consulting`
- [ ] Click "New Session"
- [ ] Verify session appears in left panel
- [ ] Verify status shows active (green dot)

### Test: All 4 explanation modes
- [ ] Set mode to "ELI5" and send message
- [ ] Verify response is simple, uses analogies
- [ ] Set mode to "Beginner"
- [ ] Verify response explains business concepts
- [ ] Set mode to "Technical"
- [ ] Verify response uses industry jargon
- [ ] Set mode to "Founder"
- [ ] Verify response is strategic, ROI-focused

### Test: Session persistence
- [ ] Send multiple messages
- [ ] Refresh the page
- [ ] Verify all messages persist
- [ ] Select different session
- [ ] Verify messages load correctly

---

## 4. Client Dashboard Interaction

### Test: Navigation
- [ ] `/client/ai-consulting` loads without error
- [ ] Session list renders
- [ ] Chat panel renders
- [ ] New Session button works

### Test: AI Phill interpretation
- [ ] Ask about SEO strategy
- [ ] Verify AI Phill provides actionable guidance
- [ ] Ask about Blue Ocean opportunities
- [ ] Verify ERRC framework mentioned
- [ ] Ask about next steps
- [ ] Verify task suggestions provided

---

## 5. Data Sync & Permissions

### Test: RLS Policies
- [ ] Log in as founder user
- [ ] Verify only their business approvals visible
- [ ] Log in as different user
- [ ] Verify they cannot see other founder's data

### Test: Page Access Control
- [ ] `/founder/approvals` - only founders can access
- [ ] `/client/ai-consulting` - only authenticated users
- [ ] Unauthorized access returns 401/403

### Test: Database Tables
- [ ] `client_approval_requests` - data persists correctly
- [ ] `client_approval_history` - audit trail logged
- [ ] `blue_ocean_strategies` - strategies saved
- [ ] `ai_consultations` - sessions created
- [ ] `ai_consultation_messages` - messages stored
- [ ] `ai_consultation_insights` - insights extracted

---

## 6. Production URLs

| Route | Status | Notes |
|-------|--------|-------|
| `/founder/approvals` | Pending | Client approval dashboard |
| `/client/ai-consulting` | Pending | AI consultation interface |
| `/api/client-approvals` | Pending | Approval API |
| `/api/ai-consultations` | Pending | Consultation API |

---

## 7. Known Issues

1. **N/A** - No known issues at launch

---

## Sign-Off

- [ ] All tests passed
- [ ] Production URLs responding
- [ ] RLS policies verified
- [ ] Ready for client interactions

**QA Completed By**: _______________
**Date**: _______________
