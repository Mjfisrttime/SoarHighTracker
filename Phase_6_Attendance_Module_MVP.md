# Phase 6 – Attendance Module (MVP)

## Objective

Develop the Attendance Module allowing **Admins** to record attendance for group members on specific dates, and allowing **Members** to view their own attendance summary.

---

# 1. Admin Attendance View

## Workflow

1. Select a Group
2. Select a Date (default: Today)
3. View list of members in the selected group
4. Mark status for each member (Present, Absent, Late)
5. Save records

### Validation
- Group must be selected.
- Date cannot be in the future.

---

# 2. Member Attendance View

Members can view a summary of their attendance:
- Total Days Present
- Total Days Absent
- Total Days Late
- Recent Attendance Records

---

# 3. Empty State

If no group is selected or group has no members:
```text
Select a group to record attendance.
Or: No members found in this group.
```

---

# 4. Loading State

```text
Loading member list...
Saving attendance...
```

---

# 5. Database Operations

Table: `attendance`

Columns used: `group_id`, `user_id`, `date`, `status`

Note: The `remarks` column (defined in Phase 1 schema) is deferred to post-MVP.

Operations:
- Read group members for a specific date
- Insert/Update attendance records (Upsert with conflict on `user_id`, `group_id`, `date`)

---

# 6. Implementation

Create: `app/dashboard/attendance/page.jsx`

Responsibilities:
- React hooks (`useState`, `useEffect`) to manage groups, selected date, and members
- Supabase bulk upsert to save attendance payload
- Calculate and display member's personal attendance summary (Present/Absent/Late counts)
- Role-based rendering (Admin vs Member views)

---

# 7. Suggested Layout (Admin)

```text
+------------------------------------------------------+
| Record Attendance                                    |
| Group: [Web Dev Team ▼]   Date: [2023-10-25 ▼]       |
+------------------------------------------------------+
| Name          Status                                 |
| John Doe      (•) Present  ( ) Absent  ( ) Late      |
| Mary Cruz     ( ) Present  (•) Absent  ( ) Late      |
+------------------------------------------------------+
|                                     [Save Records]   |
+------------------------------------------------------+
```

---

# 8. Testing Checklist

- Admin can select a group and date.
- Admin can submit attendance for multiple users at once.
- Prevent marking attendance for future dates (HTML + JS validation).
- Member can view their attendance summary.
- Attendance records include `group_id` to support users in multiple groups.

---

# Definition of Done

- [ ] Admin attendance UI completed
- [ ] Attendance records include `group_id`
- [ ] Attendance can be successfully saved to Supabase
- [ ] Member attendance summary UI completed
- [ ] Validation prevents future dates
- [ ] Loading and empty states handled

---

# Out of Scope

Do not implement yet:

- Remarks/notes per attendance record
- Editing attendance after save
- Bulk export of attendance data
- Attendance notifications
- Attendance reports (covered in Phase 9)
