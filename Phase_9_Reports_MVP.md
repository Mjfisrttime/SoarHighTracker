# Phase 9 – Reports (MVP)

## Objective

Provide the **Admin** with tabular reports for Attendance and Tasks, allowing for data filtering and export (optional MVP).

---

# 1. Attendance Report

## Features
- Select Group (Required)
- Select Month/Date Range
- Displays grid: Members (Rows) x Session Dates (Columns).
- **Summary Columns**: Total Present, Total Absent, Total Late, and Attendance Rate (%).
- **Lazy Close Fix**: The report automatically calculates missing records for valid `attendance_sessions` as "Absent".

---

# 2. Member Performance Report (Tasks)

## Features
- Select Group (Required)
- Select Month/Date Range
- Displays aggregate summary table: Member Name | Total Tasks Completed | Total Hours Logged.
- **Precision Time:** Parses time strings mathematically down to the second and formats them beautifully (e.g. "3h 45m 15s") for 100% accurate reporting.

---

# 3. Empty & Loading States

```text
Loading report data...
---
No data found for the selected filters.
```

---

# 4. Database Operations

Tables: `attendance`, `attendance_sessions`, `task_logs`, `users`, `groups`
- Read with joined/filtered queries based on form inputs.

---

# 5. Implementation

Create: `app/dashboard/reports/page.jsx`

Responsibilities:
- React hooks (`useState`, `useEffect`) for filter state and report data.
- Handle filter form submissions via `onClick` event handler.
- Query Supabase with appropriate filters (`eq`, `gte`, `lt`, `in`).
- For Attendance: Fetch `attendance_sessions` first to establish the baseline dates, then map `attendance` records against it.
- For Tasks: Group tasks by `user_id`, sum `hours_spent`, and count tasks.
- Render clean analytic summary tables.
- Role guard: only Admins can access the page.
- (Optional) CSV Export functionality.

---

```text
+------------------------------------------------------+
| Reports Analytics                                    |
| Type: [Performance ▼] Group: [Web Dev ▼] [Generate]  |
+------------------------------------------------------+
| Member        | Total Tasks | Total Hours            |
| John Doe      |     15      |     40.5             |
| Mary Cruz     |     12      |     32.0             |
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
