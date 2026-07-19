# Phase 6 – Attendance Module (MVP)

## Objective

Develop the Attendance Module using a **Self-Check-In** workflow. **Admins** open attendance sessions for groups, and **Members** check themselves in from their dashboard.

---

# 1. Admin Attendance View (Session Management)

## Workflow

1. Select a Group and Date (default: Today)
2. Click **"Open Check-In Session"**.
3. View a live list of members in the selected group, showing who has checked in (Present) and who is pending.
4. **Auto-Close:** The session stays open until midnight. Once the date changes, members can no longer see or check into the session.
5. **Lazy Update:** The next time the Admin views that past session, the system automatically marks any remaining pending members as "Absent".
6. Admins can manually override a member's status (Present/Absent/Late) at any time by clicking their status badge.

### Validation
- Only one open session per group per date.
- Sessions can only be opened for **Today's** date (preventing future/past errors).

---

# 2. Member Attendance View

## Workflow

1. Member logs into their Dashboard.
2. If there is an `Open` session for any of their groups, a banner/widget appears.
3. Member clicks **"Check In Now"**.
4. They are instantly marked "Present" and the banner disappears.

Members can also view their historical attendance summary (Present/Absent/Late counts and recent records) on their own Attendance page.

---

# 3. Database Operations

## Table: `attendance_sessions` [NEW]
Columns used: `id`, `group_id`, `date`, `status` ('open' or 'closed')
Operations:
- Create (Admin opens session for today)
- Update (System automatically sets to 'closed' on Lazy Update for past sessions)
- Read (Member checks for open sessions today)

## Table: `attendance`
Columns used: `group_id`, `user_id`, `date`, `status`
Operations:
- Insert/Update (Member self-checks-in as Present, Admin bulk marks Absents on close)

---

# 4. Suggested Layout (Admin)

```text
+------------------------------------------------------+
| Manage Attendance                                    |
| Group: [Web Dev Team ▼]   Date: [2023-10-25 ▼]       |
+------------------------------------------------------+
| Status: OPEN (Closes at Midnight)                    |
+------------------------------------------------------+
| Member          Status                               |
| John Doe        ✅ Present                            |
| Mary Cruz       ⏳ Pending                            |
+------------------------------------------------------+
```

---

# 5. Definition of Done

- [ ] Admin can open attendance sessions for today
- [ ] Member sees check-in button on Dashboard if session is open today
- [ ] Member can click check-in to mark themselves Present
- [ ] System auto-hides session at midnight
- [ ] Lazy Update marks remaining members as Absent when admin views past sessions
- [ ] Validation strictly allows opening sessions for 'Today' only
- [ ] Loading and empty states handled

---

# 6. Out of Scope

Do not implement yet:

- Passcode or QR code verification
- Automatic timed closing of sessions
- Editing attendance history after session close
- Remarks/notes per attendance record
- Bulk export of attendance data
