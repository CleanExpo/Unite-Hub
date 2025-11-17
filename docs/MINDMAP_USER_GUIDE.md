# Interactive Mindmap - User Guide

**Version:** 1.0
**Date:** 2025-01-17
**For:** Unite-Hub Users & Clients

---

## What is the Interactive Mindmap?

The Interactive Mindmap is a visual project planning tool that helps you:

✨ **Visualize** your project structure as a dynamic, drag-and-drop mindmap
🤖 **Get AI suggestions** for missing features, requirements, and improvements
🔗 **Connect ideas** by linking related nodes together
📊 **Track progress** with status indicators and priority levels
💡 **Brainstorm** freely without worrying about structure initially

---

## Getting Started

### Accessing the Mindmap

1. **Navigate to Projects**
   - Go to Dashboard → Projects
   - Click on any project

2. **Open Mindmap**
   - Click the "Mindmap" tab
   - Your project mindmap will load automatically

3. **First Time?**
   - A root node is created automatically with your project name
   - Start adding nodes to build your mindmap

---

## Interface Overview

```
┌──────────────────────────────────────────────────────┐
│  ← Back  |  Project Mindmap  |  Version 1  | Refresh │
├────────────────────────────┬─────────────────────────┤
│                            │                         │
│                            │   AI Suggestions        │
│    Your Mindmap            │   ┌──────────────────┐  │
│    (Drag & Drop)           │   │ ✨ Add Feature   │  │
│                            │   │ Consider OAuth   │  │
│    [Add Node]  [Layout]    │   │ [Apply] [Accept] │  │
│    [AI Analyze]            │   └──────────────────┘  │
│                            │                         │
│    Nodes: 5 | Connections: 3  │   More suggestions... │
└────────────────────────────┴─────────────────────────┘
```

---

## Working with Nodes

### Node Types

Each node has a type that determines its color and purpose:

| Type | Color | Use For |
|------|-------|---------|
| 🟣 **Project Root** | Purple | Main project node (auto-created) |
| 🔵 **Feature** | Blue | Major features or modules |
| 🟢 **Requirement** | Green | Specific requirements |
| 🟡 **Task** | Amber | Individual tasks or todos |
| 🔴 **Milestone** | Red | Key milestones or deliverables |
| 🌸 **Idea** | Pink | Brainstorming ideas |
| 🟦 **Question** | Indigo | Questions to resolve |
| ⚪ **Note** | Gray | General notes |

### Creating a Node

**Method 1: Add Node Button**
1. Click "Add Node" button (top right)
2. Node appears at random position
3. Drag to desired location
4. Click node to edit details

**Method 2: Quick Add** (future feature)
- Double-click on empty canvas
- Type node label
- Press Enter

### Editing a Node

1. **Select Node** - Click on any node
2. **Edit Panel Opens** (right sidebar)
3. **Update Fields:**
   - Label (node title)
   - Description
   - Type (feature, task, etc.)
   - Status (pending, in progress, completed, blocked, on hold)
   - Priority (0-10, with 8+ showing "!" indicator)

4. **Save** - Changes save automatically

### Moving Nodes

- **Drag & Drop** - Click and drag any node to reposition
- **Auto-Layout** - Click "Auto Layout" to organize nodes automatically

### Deleting a Node

1. Select node
2. Click delete button (in edit panel)
3. Confirm deletion
4. ⚠️ **Warning:** Deleting a node also deletes all its children

---

## Creating Connections

Connections show relationships between nodes.

### How to Connect

1. **Click** on the source node's edge (small circle)
2. **Drag** to the target node
3. **Release** to create connection
4. Connection appears with arrow

### Connection Types

When you create a connection, it can represent:

- **Relates To** (default) - General relationship
- **Depends On** - Target must be done first
- **Leads To** - Sequential relationship
- **Part Of** - Parent-child relationship
- **Inspired By** - Idea source
- **Conflicts With** - Incompatible features

### Deleting Connections

1. Click on the connection line
2. Press Delete key
3. Or right-click → Delete

---

## AI-Powered Suggestions

The mindmap includes AI that analyzes your project and provides intelligent suggestions.

### Triggering AI Analysis

1. **Click "AI Analyze" button** (top right)
2. **Wait 5-15 seconds** for analysis
3. **Suggestions appear** in right panel

### Types of Suggestions

| Icon | Type | Description |
|------|------|-------------|
| ✨ | **Add Feature** | Missing feature you should consider |
| 💬 | **Clarify** | Vague requirement needing clarification |
| 📈 | **Dependency** | Missing dependency identified |
| 💻 | **Technology** | Recommended tech stack |
| ⚠️ | **Warning** | Complexity or risk alert |
| 💰 | **Estimate** | Timeline or cost estimate |
| 💡 | **Alternative** | Better way to achieve goal |

### Working with Suggestions

Each suggestion shows:
- **Confidence score** (60-100%) - How confident the AI is
- **Reasoning** - Why this suggestion matters
- **Actions:**
  - **Apply** - Add to mindmap automatically (for features)
  - **Accept** - Mark as acknowledged
  - **Dismiss** - Hide this suggestion

### Example Suggestions

**Scenario:** You added "User Authentication" node

**AI Suggests:**
```
✨ Add Feature (85% confidence)
"Consider adding OAuth social login (Google, GitHub)"

Reasoning: OAuth provides better security and user experience
compared to traditional password-based auth. Reduces friction
in signup process.

[Apply] [Accept] [Dismiss]
```

If you click **Apply**, AI will:
- Create new node "OAuth Social Login"
- Link it to "User Authentication"
- Add technical details in description

---

## Best Practices

### 1. Start Simple

- Begin with 3-5 major features
- Don't overthink initial structure
- Add details as you go

### 2. Use Hierarchy

```
Project Root
  ├── Feature 1
  │   ├── Requirement 1.1
  │   └── Task 1.1.1
  ├── Feature 2
  └── Feature 3
```

### 3. Trigger AI Early and Often

- Run AI analysis after adding 5-10 nodes
- Review suggestions before adding more
- Accept/dismiss to keep suggestions relevant

### 4. Use Status Indicators

- **Pending** (gray border) - Not started
- **In Progress** (blue border) - Currently working
- **Completed** (green border) - Done
- **Blocked** (red border) - Waiting on something
- **On Hold** (yellow border) - Paused

### 5. Prioritize Wisely

- **10**: Critical, must-have
- **7-9**: High priority
- **4-6**: Medium priority
- **1-3**: Low priority, nice-to-have
- **0**: Future consideration

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Delete | Delete selected node/connection |
| Ctrl + Z | Undo (future feature) |
| Ctrl + Shift + Z | Redo (future feature) |
| Ctrl + S | Save (auto-saves already) |
| Spacebar | Pan canvas |
| Ctrl + Scroll | Zoom in/out |

---

## Common Workflows

### Workflow 1: New Project Planning

1. **Start with root node** (auto-created)
2. **Add 5-7 major features** as child nodes
3. **Run AI analysis**
4. **Review and apply suggestions**
5. **Add sub-features and requirements**
6. **Connect related nodes**
7. **Set priorities** (high-priority items first)
8. **Run AI analysis again** for gaps
9. **Export or share** with team

### Workflow 2: Brainstorming Session

1. **Create multiple "Idea" nodes** quickly
2. **Don't worry about organization**
3. **Run AI analysis** to identify themes
4. **Group related ideas** with connections
5. **Use Auto Layout** to organize
6. **Convert best ideas** to features/tasks
7. **Prioritize** remaining ideas

### Workflow 3: Feature Breakdown

1. **Create feature node** (e.g., "User Authentication")
2. **Add description** with basic details
3. **Run AI analysis** (focused on this node)
4. **Review AI suggestions** for:
   - Missing requirements
   - Technical considerations
   - Potential issues
5. **Create child nodes** for sub-features
6. **Add dependencies** with connections
7. **Set estimates** and priorities

---

## Tips & Tricks

### 💡 Tip 1: Use Colors for Context

Node types have built-in colors, but the visual hierarchy helps you see:
- Purple = Starting point (project root)
- Blue = What you're building (features)
- Green = What's required (requirements)
- Amber = What to do (tasks)

### 💡 Tip 2: AI Works Better with Details

Instead of:
```
❌ "Auth"
```

Try:
```
✅ "User Authentication"
Description: "Login, signup, password reset, and session management"
```

More details = better AI suggestions!

### 💡 Tip 3: Review Suggestions Carefully

AI suggestions are helpful but not always perfect:
- **High confidence (80%+)**: Usually accurate
- **Medium confidence (60-79%)**: Review carefully
- **Low confidence (<60%)**: Not shown by default

### 💡 Tip 4: Use Connections Wisely

Don't connect everything! Only connect when:
- There's a real dependency (X needs Y first)
- Ideas are strongly related
- You want to visualize a workflow

Too many connections = visual clutter.

### 💡 Tip 5: Auto-Layout Periodically

After adding many nodes:
1. Click "Auto Layout"
2. Review new arrangement
3. Manually adjust if needed
4. Positions save automatically

---

## Troubleshooting

### Problem: Mindmap Won't Load

**Solutions:**
1. Refresh the page
2. Check internet connection
3. Verify you're logged in
4. Contact support if persists

### Problem: Can't Create Nodes

**Solutions:**
1. Check you're on the mindmap page (not just viewing)
2. Verify you have edit permissions
3. Try refreshing

### Problem: AI Analysis Not Working

**Solutions:**
1. Ensure you have at least 2-3 nodes
2. Wait full 15 seconds (analysis takes time)
3. Check AI quota not exceeded
4. Try again in a few minutes

### Problem: Connections Won't Create

**Solutions:**
1. Ensure both nodes exist
2. Click and hold on node edge (small circle)
3. Drag to target node fully
4. Release when you see highlight

---

## Advanced Features (Coming Soon)

🔜 **Real-time Collaboration** - See team members working live
🔜 **Export to PDF/PNG** - Download mindmap as image
🔜 **Version History** - Restore previous versions
🔜 **Templates** - Start from pre-built mindmaps
🔜 **Comments** - Add notes to specific nodes
🔜 **Undo/Redo** - Step backward/forward through changes

---

## FAQ

**Q: How many nodes can I create?**
A: No hard limit, but 50-100 nodes is optimal for performance.

**Q: Can I share my mindmap?**
A: Yes! Share the project with team members who will see the mindmap.

**Q: Does AI cost extra?**
A: AI analysis is included. Heavy usage may have limits (contact sales).

**Q: Can I export my mindmap?**
A: JSON export available now. PDF/PNG export coming soon.

**Q: Is my data private?**
A: Yes! Mindmaps are workspace-isolated and never shared between organizations.

**Q: Can clients see my mindmap?**
A: Only if you explicitly share project access with them.

**Q: What happens if I delete a project?**
A: Mindmap is deleted along with the project (within cascade rules).

---

## Getting Help

- **In-App Support**: Click help icon (?)
- **Documentation**: docs.unite-hub.com
- **Email Support**: support@unite-hub.com
- **Live Chat**: Available Mon-Fri 9am-5pm

---

## Feedback

We're constantly improving! Share your feedback:

- 👍 What works well?
- 👎 What's confusing?
- 💡 Feature requests?
- 🐛 Found a bug?

Email: feedback@unite-hub.com

---

**Happy Mindmapping! 🎨🧠✨**

---

**Version:** 1.0
**Last Updated:** 2025-01-17
**Created by:** Unite-Hub Team
