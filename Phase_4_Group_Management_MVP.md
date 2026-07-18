# Phase 4 – Group Management (MVP)

## Objective

Develop the Group Management module that allows **Admins** to create, manage, update, and delete groups. Members can only view the groups they belong to.

---

# Module Overview

Only users with the **Admin** role can manage groups.

Members can:
- View their assigned groups
- View group information

---

# 1. Group List

## Purpose

Display all existing groups.

### Information to Display

- Group Name
- Description
- Total Members
- Created By
- Date Created

---

# 2. Create Group

## Fields

- Group Name
- Description

### Validation

- Group Name is required
- Group Name must be unique
- Description is optional

### Action

Save the new group into the database.

---

# 3. Edit Group

Admin can update:
- Group Name
- Description

### Validation

- Group Name cannot be empty
- Prevent duplicate group names

---

# 4. Delete Group

Display a confirmation dialog before deleting.

When deleted:
- Remove the group
- Remove related group memberships

---

# 5. View Group Details

Display:

- Group Name
- Description
- Total Members
- Created By
- Date Created

---

# 6. Search Groups

Allow searching by Group Name.

---

# 7. Empty State

If no groups exist:

```
No groups have been created yet.
Create your first group.
```

---

# 8. Loading State

```
Loading groups...
```

---

# 9. Database Operations

Table:

```
groups
```

Operations:

- Create
- Read
- Update
- Delete

---

# 10. JavaScript

Create:

```
js/groups.js
```

Responsibilities:

- Load groups
- Create group
- Update group
- Delete group
- Search groups
- Validate input

---

# 11. Suggested Layout

```text
+------------------------------------------------------+
| Groups                                        [+ Add]|
+------------------------------------------------------+
| Search Group...                                   🔍 |
+------------------------------------------------------+

+-----------------------------------------------+
| Web Development Team                          |
| Members: 12                                   |
| [View] [Edit] [Delete]                        |
+-----------------------------------------------+
```

---

# Testing Checklist

- Create group
- View groups
- Edit group
- Delete group
- Search groups
- Validate required fields

---

# Definition of Done

- [ ] Admin can create groups
- [ ] Admin can view groups
- [ ] Admin can edit groups
- [ ] Admin can delete groups
- [ ] Members can view assigned groups
- [ ] Search works
- [ ] Loading and empty states implemented
- [ ] CRUD operations use Supabase

---

# Out of Scope

- Member Management
- Attendance
- Task Logs
- Reports
- File Uploads
- Announcements
