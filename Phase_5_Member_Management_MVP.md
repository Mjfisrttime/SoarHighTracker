# Phase 5 – Member Management (MVP)

## Objective

Develop the Member Management module that allows **Admins** to manage group memberships. Members can view the groups they belong to but cannot manage other members.

---

# Module Overview

Admin can:

- View all users
- Add members to groups
- Remove members from groups
- View group members
- Search members

Members can:

- View the groups they belong to (via Groups page)

---

# 1. Member List

## Purpose

Display all registered users.

### Information to Display

- Name
- Email
- Role
- Joined Date

---

# 2. Add Member to Group

## Workflow

1. Select a Group
2. Select a User
3. Add the user to the selected group

### Validation

- User must exist
- User cannot be added twice to the same group

---

# 3. Manage Group Assignments

Admin clicks "Manage Groups" on a user to open an assignment modal.

The modal displays:

- Current groups the user belongs to (with Remove option)
- A dropdown to assign the user to a new group

This is a **user-centric flow** (select user → manage their groups), not a group-centric flow.

---

# 4. Remove Member

Admin can remove a member from a group.

Display confirmation before removal.

Example:

```
Remove this member from the group?

[Cancel]   [Remove]
```

---

# 5. Search Members

Allow searching by:

- Name
- Email

---

# 6. Empty State

If a group has no members:

```
No members have been added yet.
```

---

# 7. Loading State

```
Loading members...
```

---

# 8. Database Operations

## users

Read registered users.

## group_members

Operations:

- Add member
- View members
- Remove member

---

# 9. Implementation

Create:

```text
app/dashboard/members/page.jsx
```

Responsibilities:

- React hooks (`useState`, `useEffect`) to load users and their assigned groups
- Supabase queries to read users and manage `group_members`
- Add member to group via assignment modal
- Remove member from group via assignment modal
- Search members by name or email
- Handle unique constraint errors (prevent duplicate membership)

---

# 10. Suggested Layout

```text
+------------------------------------------------------+
| Members                                              |
+------------------------------------------------------+
| Search Member...                               🔍    |
+------------------------------------------------------+

+------------------------------------------------------+
| Name          Email               Role      Actions   |
+------------------------------------------------------+
| John Doe      john@email.com      Member   [Manage]  |
| Mary Cruz     mary@email.com      Member   [Manage]  |
+------------------------------------------------------+

--- Modal (on clicking Manage) ---

+------------------------------------------------------+
| Manage Groups                                        |
| For: John Doe                                        |
+------------------------------------------------------+
| Current Groups:                                      |
|   Web Dev Team                           [Remove]    |
|   Design Team                            [Remove]    |
+------------------------------------------------------+
| [Select a group... ▼]                       [Add]    |
+------------------------------------------------------+
|                    [Close]                            |
+------------------------------------------------------+
```

---

# Testing Checklist

- View all users
- Add member to a group
- Prevent duplicate membership
- View group members
- Remove member
- Search members
- Validate required fields

---

# Definition of Done

- [ ] Admin can view registered users
- [ ] Admin can add members to groups
- [ ] Admin can remove members from groups
- [ ] Group member list displays correctly
- [ ] Search functionality works
- [ ] Loading and empty states implemented
- [ ] Membership operations use Supabase

---

# Out of Scope

Do not implement yet:

- Attendance
- Task Logs
- Reports
- Member invitations via email
- Role management
- Permissions management
- Notifications
- Members viewing other members in the same group (deferred to post-MVP)
