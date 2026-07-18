# Phase 7 – Task Log Module (MVP)

## Objective

Develop the Task Log Module allowing **Members** to submit completed tasks and **Admins** to review all submitted tasks across groups.

---

# 1. Member Task Submission

## Fields

- Title
- Description
- Completion Date
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
Filters:
- By Group
- By Date Range

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

Operations:
- Insert (Member submits task)
- Read (Member views own, Admin views all)

---

# 7. JavaScript

Create: `js/tasklogs.js`

Responsibilities:
- Handle task form submission
- Validate inputs
- Load task list (Admin vs Member views)
- Handle filtering for Admin

---

# 8. Suggested Layout (Member)

```text
+------------------------------------------------------+
| Submit New Task                                      |
| Title: [_____________________]                       |
| Date:  [2023-10-25]                                  |
| Desc:  [_____________________]                       |
| [Submit Task]                                        |
+------------------------------------------------------+
| My Recent Tasks                                      |
| - Setup Auth Module (Oct 25)                         |
| - Created Database Schema (Oct 24)                   |
+------------------------------------------------------+
```

---

# 9. Testing Checklist

- Member can submit a task successfully.
- Required fields are validated.
- Member sees their own tasks.
- Admin can view tasks from all members.
- Admin can filter tasks by group.

---

# Definition of Done

- [ ] Task submission form created and functional
- [ ] Member view of own tasks completed
- [ ] Admin view of all tasks completed
- [ ] Admin filters implemented
- [ ] Loading and empty states handled
