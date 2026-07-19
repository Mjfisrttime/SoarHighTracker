# Phase 3 – Dashboard (MVP)

## Objective

Build the main dashboard displayed after a user logs in. The dashboard should show different information depending on whether the user is an **Admin** or a **Member**.

---

# Dashboard Flow

After a successful login:

1. Check the logged-in user's role.
2. Redirect to `/dashboard`.
3. Load the appropriate dashboard data.

- Admin → System Overview
- Member → Personal Overview

---

# 1. Admin Dashboard

## Purpose

Provide an overview of the entire system.

## Summary Cards

Display:

- Total Groups
- Total Members
- Attendance Recorded Today
- Total Task Logs

Example:

```text
-------------------------------
Total Groups           5
Total Members         28
Attendance Today      24
Task Logs            103
-------------------------------
```

---

## Recent Activity

Show the latest system activities.

Example:

```text
John submitted a task.

Mary marked attendance.

Admin created "Research Team".

Peter joined Web Development Team.
```

Display newest activity first.

---

## Quick Actions

Buttons:

- Create Group
- Manage Members
- Record Attendance
- View Reports

---

# 2. Member Dashboard

## Purpose

Provide members with a summary of their own information.

## Summary Cards

Display:

- My Groups
- My Attendance Records
- My Submitted Tasks

Example:

```text
--------------------------
My Groups            2
Attendance          18
Task Logs           15
--------------------------
```

---

## My Recent Activities

Example:

```text
Completed Login Module

Finished UI Design

Submitted Documentation
```

---

# 3. Navigation

## Admin

- Dashboard
- Groups
- Members
- Attendance
- Task Logs
- Reports
- Settings
- Profile
- Logout

## Member

- Dashboard
- My Groups
- Attendance
- Task Logs
- Settings
- Profile
- Logout

---

# 4. Suggested Layout

```text
+------------------------------------------------------+
| Logo                         User Profile            |
+------------------------------------------------------+
| Sidebar | Dashboard Cards                           |
|         |-------------------------------------------|
|         | Recent Activity                           |
|         |-------------------------------------------|
|         | Quick Actions                             |
+------------------------------------------------------+
```

---

# 5. Data to Retrieve

## Admin

- Total groups
- Total members
- Today's attendance
- Total task logs

## Member

- Joined groups
- Attendance records
- Submitted task logs

---

# 6. Implementation

Create:

```text
app/dashboard/page.jsx
```

Responsibilities:

- React hooks (`useEffect`, `useState`) to load dashboard statistics based on role
- Load recent activities (global for Admin, personal for Member)
- Handle loading state with React conditionals
- Handle empty state for activities

---

# 7. Loading & Empty States

Loading:

```text
Loading dashboard...
```

Empty:

```text
No activities found.
```

---

# 8. Testing Checklist

## Admin

- Dashboard loads
- Summary cards display correct values
- Recent activity loads
- Quick action buttons work

## Member

- Personal summary displays correctly
- Recent activities load
- Navigation works

---

# Definition of Done

- [ ] Redirect to dashboard after login
- [ ] Admin dashboard works
- [ ] Member dashboard works
- [ ] Summary cards display correct data
- [ ] Recent Activity section works
- [ ] Navigation works
- [ ] Dashboard data loads from Supabase
- [ ] Loading and empty states implemented

---

# Out of Scope

Do not implement yet:

- Charts
- Notifications
- Realtime updates
- Calendar
- Announcements
- Advanced analytics
- Search
- Filters
