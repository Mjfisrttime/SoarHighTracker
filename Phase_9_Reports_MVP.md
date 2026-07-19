# Phase 9 – Reports (MVP)

## Objective

Provide the **Admin** with tabular reports for Attendance and Tasks, allowing for data filtering and export (optional MVP).

---

# 1. Attendance Report

## Features
- Select Group (Required)
- Select Month/Date Range
- Displays grid: Members (Rows) x Dates (Columns) or a simple list view.

---

# 2. Task Report

## Features
- Select Group
- Select Member (Optional)
- Displays list of tasks with completion dates.

---

# 3. Empty & Loading States

```text
Loading report data...
---
No data found for the selected filters.
```

---

# 4. Database Operations

Tables: `attendance`, `task_logs`, `users`, `groups`
- Read with joined/filtered queries based on form inputs.

---

# 5. Implementation

Create: `app/dashboard/reports/page.jsx`

Responsibilities:
- React hooks (`useState`, `useEffect`) for filter state and report data.
- Handle filter form submissions via `onClick` event handler.
- Query Supabase with appropriate filters (`eq`, `gte`, `lt`, `in`).
- Render attendance grid (Members × Dates) or task list in a tabular format.
- Role guard: only Admins can access the page.
- (Optional) CSV Export functionality.

---

# 6. Suggested Layout

```text
+------------------------------------------------------+
| Reports                                              |
| Type: [Attendance ▼] Group: [Web Dev ▼]  [Generate]  |
+------------------------------------------------------+
| Member        | Oct 21 | Oct 22 | Oct 23 | Total     |
| John Doe      |   P    |   P    |   A    |  2/3      |
| Mary Cruz     |   P    |   L    |   P    |  3/3      |
+------------------------------------------------------+
```

---

# 7. Testing Checklist

- Admin can generate attendance report by group.
- Admin can generate task report by group.
- Filters correctly limit the data returned.
- Empty states display if no records match.

---

# Definition of Done

- [ ] Report filtering UI implemented
- [ ] Attendance report view completed
- [ ] Task report view completed
- [ ] Supabase queries handle filtering correctly
