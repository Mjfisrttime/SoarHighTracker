# Phase 8 – Activity Feed (MVP)

## Objective

Implement a system-wide activity feed on the Admin Dashboard to track recent events dynamically.

---

# 1. Tracked Activities

- Attendance recorded by Admin
- Task submitted by Member
- New Group created
- New Member added to a Group

---

# 2. Data Retrieval Strategy

Since Supabase doesn't have a built-in unified activity feed for arbitrary tables without triggers/functions, the MVP will fetch the most recent records from `task_logs`, `attendance`, `groups`, and `group_members`, combine them in JavaScript, sort them by timestamp, and display the top 10.

*(Future scale: Use database triggers to populate a dedicated `activities` table).*

---

# 3. Display Format

Each activity item should show:
- Icon/Avatar (optional)
- Action text (e.g., "John Doe submitted a task: Auth Setup")
- Timestamp (e.g., "2 hours ago")

---

# 4. Empty & Loading States

```text
Loading recent activity...
---
No recent activities found.
```

---

# 5. JavaScript

Create/Update: `js/activity.js` or integrate into `dashboard.js`

Responsibilities:
- Fetch recent data from multiple tables
- Normalize and sort data by date descending
- Render HTML for feed items
- Format timestamps relative to now

---

# 6. Suggested Layout

```text
+------------------------------------------------------+
| Recent Activity                                      |
+------------------------------------------------------+
| [Task] John Doe submitted "Auth Setup" (2 hrs ago)   |
| [Group] Admin created "Marketing Team" (1 day ago)   |
| [Users] Mary was added to "Marketing Team" (1d ago)  |
+------------------------------------------------------+
```

---

# 7. Testing Checklist

- Feed loads combined data from multiple tables.
- Feed is sorted chronologically (newest first).
- Empty state displays when no data exists.
- Timestamps are formatted clearly.

---

# Definition of Done

- [ ] Activity data fetched and combined successfully
- [ ] Feed displays on Admin dashboard
- [ ] Items sorted correctly by date
- [ ] Empty and loading states handled
