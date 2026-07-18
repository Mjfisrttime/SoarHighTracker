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

Operations:
- Read group members for a specific date
- Insert/Update attendance records (Upsert based on group, user, and date)

---

# 6. JavaScript

Create: `js/attendance.js`

Responsibilities:
- Load admin groups for the dropdown
- Load members for the selected group
- Handle date selection
- Submit attendance payload to Supabase
- Load member's personal attendance summary

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
- Prevent marking attendance for future dates.
- Member can view their attendance summary.

---

# Definition of Done

- [ ] Admin attendance UI completed
- [ ] Attendance can be successfully saved to Supabase
- [ ] Member attendance summary UI completed
- [ ] Validation prevents future dates
- [ ] Loading and empty states handled
