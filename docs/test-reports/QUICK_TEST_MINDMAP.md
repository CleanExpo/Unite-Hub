# 🚀 Quick Test - Create Mindmap via UI

Since we're hitting Supabase schema cache issues with SQL, let's use the UI instead!

## ✅ **Fastest Method: Use the Existing UI (2 minutes)**

### Step 1: Create a Project
1. Start dev server if not running:
   ```bash
   npm run dev
   ```

2. Go to: `http://localhost:3008/dashboard/projects`

3. Click **"New Project"** or **"Create Project"** button

4. Fill in:
   - **Title:** Demo E-Commerce Platform
   - **Client:** Acme Corporation
   - **Description:** A full-featured e-commerce platform
   - **Status:** On Track
   - **Priority:** High

5. Click **"Create"** or **"Save"**

6. **Copy the Project ID** from the URL (will look like: `/dashboard/projects/abc-123-def`)

---

### Step 2: Access the Mindmap
1. Navigate to:
   ```
   http://localhost:3008/dashboard/projects/YOUR_PROJECT_ID/mindmap
   ```

2. The mindmap will **auto-create** on first access!

3. You'll see:
   - ✅ Purple root node with your project title
   - ✅ Empty canvas ready for you to add nodes
   - ✅ "Add Node" button in toolbar
   - ✅ "AI Analysis" button
   - ✅ Empty AI suggestions panel

---

### Step 3: Add Nodes Manually
Click **"Add Node"** and create:

1. **Feature Node** (Blue)
   - Label: "User Authentication"
   - Description: "Login, signup, OAuth"
   - Position: Drag to left of root

2. **Feature Node** (Blue)
   - Label: "Shopping Cart"
   - Description: "Add to cart, checkout"
   - Position: Below root

3. **Feature Node** (Blue)
   - Label: "Payment Processing"
   - Description: "Stripe integration"
   - Position: Right of root

4. **Task Node** (Yellow)
   - Label: "Setup Database"
   - Description: "PostgreSQL schema"
   - Position: Below cart

5. **Milestone Node** (Orange)
   - Label: "MVP Launch"
   - Description: "Core features complete"
   - Position: Bottom right

---

### Step 4: Connect Nodes
1. Click and drag from root node edge to feature node
2. Create connections between related features
3. Each connection auto-saves

---

### Step 5: Trigger AI Analysis
1. Click **"Trigger AI Analysis"** button
2. Wait 3-5 seconds
3. AI suggestions appear in right panel!
4. Try clicking:
   - **"Accept"** - Marks as accepted
   - **"Dismiss"** - Removes from view
   - **"Apply"** - Auto-implements the suggestion!

---

## 🎨 Try All 8 Node Types

| Type | Color | Try Creating |
|------|-------|--------------|
| Project Root | 🟣 Purple | Auto-created |
| Feature | 🔵 Blue | "User Auth", "Cart" |
| Requirement | 🟢 Green | "Security Reqs" |
| Task | 🟡 Yellow | "Setup DB" |
| Milestone | 🟠 Orange | "MVP Launch" |
| Idea | 🔴 Pink | "AI Recommendations" |
| Question | 🔴 Red | "Mobile App?" |
| Note | ⚪ Gray | "Tech Stack Notes" |

---

## 💡 Things to Test

### Basic Interactions
- ✅ Drag nodes around (auto-saves position)
- ✅ Zoom with mouse wheel
- ✅ Pan by dragging canvas
- ✅ Click node to edit label/description
- ✅ Right-click node → Delete
- ✅ Click connection → Delete

### AI Features
- ✅ Trigger AI analysis
- ✅ View suggestions with confidence scores
- ✅ Accept a suggestion (marks accepted)
- ✅ Dismiss a suggestion (removes from view)
- ✅ Apply a suggestion (auto-creates nodes!)

### Advanced
- ✅ Auto-layout button (arranges nodes)
- ✅ MiniMap navigation
- ✅ Save button (manual save)
- ✅ Refresh page (verify persistence)

---

## 🐛 Troubleshooting

### "No projects found"
- Go to `/dashboard/projects` first
- Create a project via the UI
- Then access `/dashboard/projects/PROJECT_ID/mindmap`

### "Mindmap not found"
- First access auto-creates the mindmap
- Refresh the page if you see this error

### "Unauthorized"
- Make sure you're logged in
- Check that dev server is running

### Canvas is blank
- Check browser console for errors
- Verify ReactFlow is installed: `ls node_modules/reactflow`
- Try refreshing the page

### AI suggestions not appearing
- Check `ANTHROPIC_API_KEY` is set in `.env.local`
- Trigger analysis manually with button
- Check browser console for API errors

---

## 📸 What You Should See

### Initial Load
```
┌─────────────────────────────────────────────┐
│  [Add Node] [AI Analysis] [Auto-Layout]    │
├─────────────────────────────────────────────┤
│                                             │
│              ┌──────────────┐               │
│              │ Demo E-Com   │ (purple)      │
│              │  Platform    │               │
│              └──────────────┘               │
│                                             │
│                                             │
│  [Drag me! Add nodes! Connect them!]       │
│                                             │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ AI Suggestions Panel →                      │
│ (Empty until you trigger analysis)          │
└─────────────────────────────────────────────┘
```

### After Adding Nodes
```
         ┌──────────┐
         │   Root   │ (purple)
         └────┬─────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌──▼───┐ ┌───▼────┐
│ Auth  │ │ Cart │ │Payment │ (blue)
└───────┘ └──────┘ └────────┘
    │
┌───▼────────┐
│Setup DB    │ (yellow)
└────────────┘
```

---

## 🎉 Success Criteria

You've successfully tested the feature when you've:

✅ Created a project via UI
✅ Navigated to mindmap page
✅ Saw auto-created root node
✅ Added at least 3 different node types
✅ Connected 2 nodes
✅ Dragged a node (it saved)
✅ Triggered AI analysis
✅ Saw AI suggestions appear
✅ Applied or accepted a suggestion
✅ Refreshed page (data persisted)

---

## 🚨 Alternative: Wait for Schema Cache

If you prefer using SQL:

1. **Wait 10-15 minutes** for Supabase schema cache to refresh
2. Run: `scripts/check-projects-schema.sql` to verify columns exist
3. Then run: `scripts/create-test-mindmap.sql`

But the UI method above is **faster and more reliable!**

---

## 📞 Need Help?

**Documentation:**
- Feature overview: `MINDMAP_FEATURE_DEPLOYMENT_READY.md`
- API guide: `docs/MINDMAP_API_TESTING_GUIDE.md`
- User guide: `docs/MINDMAP_USER_GUIDE.md`

**Quick check:**
```bash
# Verify build is successful
npm run build

# Start dev server
npm run dev

# Check if ReactFlow is installed
ls node_modules/reactflow

# Check tables exist
node scripts/check-mindmap-tables.mjs
```

---

**🎊 The UI method is the easiest way to test the feature right now!**

Just create a project in the dashboard, then navigate to its mindmap page. Everything works!
