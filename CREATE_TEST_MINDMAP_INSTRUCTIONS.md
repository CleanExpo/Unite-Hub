# 🎯 Create Test Project with Mindmap - Instructions

## ✅ Quick Setup (2 minutes)

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your Unite-Hub project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste the SQL**
   - Open the file: `scripts/create-test-mindmap.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor

4. **Update User ID** (Important!)
   - Find this line at the top:
     ```sql
     v_user_id UUID := '0082768b-c40a-4c4e-8150-84a3dd406cbc';
     ```
   - Replace with your actual user ID (find it in `auth.users` table)
   - Or keep the default if it's your current user ID

5. **Run the Script**
   - Click "Run" or press `Ctrl+Enter`
   - Wait for success message in output

6. **Check the Output**
   You should see:
   ```
   SUCCESS! Test project with mindmap created!
   Project ID: [some UUID]
   Mindmap ID: [some UUID]
   Nodes: 11 (1 root + 10 features)
   Connections: 6
   AI Suggestions: 5
   Access URL: http://localhost:3008/dashboard/projects/[PROJECT_ID]/mindmap
   ```

7. **Copy the URL** from the output and use it to access your mindmap!

---

## 📊 What Gets Created

### Project Details
- **Title:** Demo E-Commerce Platform
- **Client:** Acme Corporation
- **Status:** On Track (25% complete)
- **Priority:** High

### Mindmap Structure (11 Nodes)

1. **Root Node** (Purple) - "Demo E-Commerce Platform"

2. **Feature Nodes** (Blue)
   - User Authentication (Login, OAuth)
   - Shopping Cart (Add to cart, save for later)
   - Payment Processing (Stripe, multiple methods)
   - Admin Dashboard (Product management, analytics)

3. **Requirement Node** (Green)
   - Security Requirements (SSL, GDPR, PCI DSS)

4. **Milestone Node** (Orange)
   - MVP Launch (Core features ready)

5. **Task Node** (Yellow)
   - Setup Database Schema

6. **Idea Node** (Pink)
   - AI Product Recommendations

7. **Question Node** (Red)
   - Mobile App Support?

8. **Note Node** (Gray)
   - Tech Stack Decision

### Connections (6 Links)
- Root → Core Features (hierarchy)
- Auth → Cart (dependency)
- Cart → Payment (dependency)
- Auth → Admin (dependency)

### AI Suggestions (5 Suggestions)
1. **Add Two-Factor Authentication** (85% confidence)
2. **Use Stripe Checkout** (90% confidence)
3. **Product Search & Filtering** (75% confidence)
4. **Inventory Management Needed** (80% confidence)
5. **Scaling Considerations** (70% confidence)

---

## 🚀 Access Your Mindmap

### Start Dev Server
```bash
npm run dev
```

### Navigate to Mindmap
The SQL script output will show the exact URL, like:
```
http://localhost:3008/dashboard/projects/a1b2c3d4.../mindmap
```

### What You Can Do
- ✅ Drag nodes around the canvas
- ✅ Click "Add Node" to create new nodes
- ✅ Connect nodes by dragging from one to another
- ✅ Click nodes to edit their properties
- ✅ View AI suggestions in the right panel
- ✅ Accept/dismiss/apply AI suggestions
- ✅ Trigger new AI analysis
- ✅ Save changes (auto-saves on drag/edit)

---

## 🎨 Node Types & Colors

| Type | Color | Icon | Use For |
|------|-------|------|---------|
| Project Root | Purple 🟣 | 📦 | Main project |
| Feature | Blue 🔵 | ⚡ | Features/epics |
| Requirement | Green 🟢 | ✓ | Requirements |
| Task | Yellow 🟡 | ☐ | Tasks/subtasks |
| Milestone | Orange 🟠 | 🎯 | Milestones |
| Idea | Pink 🔴 | 💡 | Brainstorming |
| Question | Red 🔴 | ❓ | Open questions |
| Note | Gray ⚪ | 📝 | Notes/comments |

---

## 🤖 AI Suggestion Actions

### Accept
- Marks suggestion as "accepted"
- Keeps it in the list for reference
- No changes to mindmap

### Dismiss
- Removes suggestion from view
- Marks as "dismissed" in database
- Can be restored later

### Apply
- Automatically implements the suggestion
- Creates new nodes OR updates existing ones
- Marks as "applied"
- One-click implementation!

---

## 🔧 Troubleshooting

### Issue: "Could not find user_id"
**Solution:** Update the `v_user_id` variable in the SQL script

To find your user ID:
```sql
SELECT id, email FROM auth.users;
```

### Issue: "Could not find org_id"
**Solution:** Make sure you've signed up and have an organization

Check:
```sql
SELECT * FROM user_organizations WHERE user_id = 'YOUR_USER_ID';
```

### Issue: SQL script fails
**Solution:** Run the mindmap migration first

Check if tables exist:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'mindmap%';
```

Should show:
- mindmap_nodes
- mindmap_connections
- project_mindmaps
- ai_suggestions

If not, run: `supabase/migrations/028_mindmap_feature_FIXED.sql`

---

## 📸 What to Expect

### Initial View
- Canvas with purple root node at top
- 10 colored nodes arranged below
- Lines connecting related nodes
- AI suggestions panel on the right (5 suggestions)
- Toolbar with "Add Node" and "AI Analysis" buttons

### Interactions
- Drag any node → Auto-saves position
- Click node → Edit label/description
- Right-click → Delete node
- Click connection → Delete connection
- Drag from node edge → Create connection
- Click "Add Node" → Modal to create new node
- Click suggestion "Apply" → Auto-creates/updates

---

## 💡 Tips & Tricks

1. **Auto-Layout:** Click the layout button to automatically arrange nodes
2. **Zoom:** Use mouse wheel to zoom in/out
3. **Pan:** Click and drag empty canvas space
4. **MiniMap:** Use the mini-map in the corner for navigation
5. **Keyboard:** Press `Backspace` to delete selected node
6. **Save:** Changes auto-save, but you can manually save anytime

---

## 🎉 Next Steps

After creating the test project:

1. **Explore the Canvas**
   - Drag nodes around
   - Try all node types
   - Create connections

2. **Test AI Features**
   - Click "Trigger AI Analysis"
   - Review suggestions
   - Apply a suggestion

3. **Create Your Own**
   - Add a new node
   - Connect it to existing nodes
   - Edit properties

4. **Share with Team**
   - Show off the visual planning tool
   - Get feedback on usability
   - Identify improvements needed

---

## 📞 Need Help?

**Documentation:**
- Main guide: `MINDMAP_FEATURE_DEPLOYMENT_READY.md`
- API docs: `docs/MINDMAP_API_TESTING_GUIDE.md`
- User guide: `docs/MINDMAP_USER_GUIDE.md`

**Quick Commands:**
- See: `MINDMAP_QUICK_COMMANDS.md`

**Support:**
- Check browser console for errors
- Review Supabase logs
- Run diagnostic: `node scripts/check-mindmap-tables.mjs`

---

**🎊 Enjoy exploring the mindmap feature!**

The SQL script creates a fully populated example so you can see all the features in action immediately.
