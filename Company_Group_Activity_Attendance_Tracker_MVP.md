# Company Group Activity & Attendance Tracker
## MVP Development Plan

### Tech Stack
- HTML
- CSS
- JavaScript
- Supabase (Auth + Database)

---

# Phase 1 – Project Setup

## Goal
Set up the project structure and connect to Supabase.

### Tasks
- Create project folders
- Create Supabase project
- Connect frontend to Supabase
- Create database tables
- Configure authentication

Suggested structure:

```text
project/
│
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── css/
├── js/
├── pages/
├── assets/
└── components/
```

---

# Phase 2 – Authentication

## Pages
- Login
- Register

## Features
- User registration
- User login
- Logout
- Session checking
- Redirect after login

---

# Phase 3 – Dashboard

## Admin Dashboard
Display:
- Total Groups
- Total Members
- Attendance Today
- Total Task Logs
- Recent Activity

## Member Dashboard
Display:
- My Groups
- My Attendance Summary
- My Submitted Tasks

---

# Phase 4 – Group Management (Admin)

## Pages
- Group List
- Create Group
- Edit Group

## Features
- Create Group
- View Groups
- Edit Group
- Delete Group

---

# Phase 5 – Member Management (Admin)

## Features
- View Members
- Add Member to Group
- Remove Member from Group
- Search Members

---

# Phase 6 – Attendance Module (Admin)

## Page
Attendance

## Features
- Select Group
- Select Date
- Mark Attendance
  - Present
  - Absent
  - Late
- Save Attendance Records

---

# Phase 7 – Task Log Module

## Member
Submit completed task.

Fields:
- Title
- Description
- Completion Date

## Admin
- View all submitted task logs

---

# Phase 8 – Activity Feed

Display latest group activities.

Examples:
- John submitted a task.
- Mary submitted documentation.
- Attendance recorded for today.

Sort by newest first.

---

# Phase 9 – Reports

## Admin

Attendance History
- Filter by Group
- Filter by Date

Task History
- Filter by Group
- Filter by Date

---

# Phase 10 – Profile

Every user can:
- View Profile
- Update Name
- Change Password

---

# Navigation

## Admin
- Dashboard
- Groups
- Members
- Attendance
- Task Logs
- Reports
- Profile
- Logout

## Member
- Dashboard
- My Groups
- Attendance
- Task Logs
- Profile
- Logout

---

# Development Order

1. Project Setup
2. Authentication
3. Dashboard
4. Group Management
5. Member Management
6. Attendance Module
7. Task Log Module
8. Activity Feed
9. Reports
10. Profile
11. Testing & Bug Fixes

---

# MVP Scope

The MVP focuses only on the core workflow:

1. User Authentication
2. Group Management
3. Member Management
4. Attendance Tracking
5. Task Logging
6. Dashboard
7. Reports
8. User Profile

Additional features can be added after the MVP is fully functional and tested.
