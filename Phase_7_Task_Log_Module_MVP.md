# Phase 7 – Task Log Module (MVP)

## Objective

Develop the Task Log Module allowing **Members** to submit completed tasks and **Admins** to review all submitted tasks across groups.

---

# 1. Member Task Submission

## Fields

- Title
- Description
- Completion Date
- **Time Spent:** Exact input for Hours, Minutes, and Seconds (stored as a formatted string like "2h 30m 15s")
- Group (if part of multiple groups)

## Validation

- Title is required (min 3 characters).
- Description is optional but recommended.
- Completion Date defaults to today, cannot be in the future.

---

# 2. Member Task List

Display tasks submitted by the logged-in member.
- Title
- Date
- Group

---

# 3. Admin Task View

Admin can view all tasks submitted by all members.

## Filters
- By Group
- By Date
- **By Member** [NEW]

## Summary Widgets [NEW]
Displays dynamic statistics based on current filters:
- **Total Tasks** (count of filtered rows)
- **Total Hours** (sum of parsed hours from filtered rows)
- **Active Members** (count of unique users in filtered rows)

---

# 4. Empty State

```text
You haven't submitted any tasks yet.
(Admin): No tasks submitted in the selected filter.
```

---

# 5. Loading State

```text
Submitting task...
Loading tasks...
```

---

# 6. Database Operations

Table: `task_logs`

Columns used:
- `user_id` – who submitted the task
- `title` – task title
- `task_description` – task details (optional)
- `date` – completion date
- `group_id` – associated group (optional)
- `hours_spent` – time spent on task
- `logged_at` – timestamp when the task was logged (auto-generated)

Operations:
- Insert (Member submits task)
- Read (Member views own, Admin views all)

---

# 7. Implementation

Create: `app/dashboard/task-logs/page.jsx`

Responsibilities:
- React hooks (`useState`, `useEffect`) to handle task form submission and state
- Supabase queries to insert and read `task_logs`
- Validate inputs before submission
- Role-based rendering (Admin vs Member views)
- Handle state-based filtering for Admin

---

# 8. Suggested Layout (Member)

```text
+---------------------------+--------------------------------------+
| Submit New Task           | My Recent Tasks                      |
|                           |                                      |
| Title: [____________]     | +----------------------------------+ |
| Date:  [2023-10-25]      | | Setup Auth Module                | |
| Group: [Select... ▼]     | | Web Dev Team · Oct 25 · 2 hours  | |
| Time:  [2 hours]         | | Description text here...         | |
| Desc:  [____________]    | +----------------------------------+ |
|                           |                                      |
| [Submit Task]             | +----------------------------------+ |
|                           | | Created Database Schema          | |
|                           | | Oct 24 · 1 hour                  | |
|                           | | Description text here...         | |
|                           | +----------------------------------+ |
+---------------------------+--------------------------------------+
```

Layout: Form (1/3 width, left side) + Task feed (2/3 width, right side)

---

# 9. Testing Checklist

- Member can submit a task successfully.
- Required fields are validated (title min 3 chars, date required).
- Completion date cannot be in the future.
- Member sees their own tasks.
- Admin can view tasks from all members.
- Admin can filter tasks by **Group**, **Date**, and **Member**.
- **Summary Widgets** dynamically calculate Total Tasks, Total Hours, and Active Members based on filters.
- `hours_spent` is displayed for each task and parsed correctly for the total summary.

---

# Definition of Done

- [ ] Task submission form created and functional
- [ ] Member view of own tasks completed
- [ ] Admin view of all tasks completed
- [ ] Admin filters implemented (by Group, Date, and Member)
- [ ] Admin Summary Widgets implemented (Total Tasks, Hours, Members)
- [ ] Loading and empty states handled
- [ ] `hours_spent` field captured and displayed

---

# Out of Scope

Do not implement yet:

- Editing or deleting submitted tasks
- File/image attachments on tasks
- Task approval workflow
- Task categories or tags
- Date range filter for Admin (currently single-date)
- Task reports (covered in Phase 9)
- Notifications on task submission
