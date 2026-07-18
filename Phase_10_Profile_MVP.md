# Phase 10 – Profile (MVP)

## Objective

Allow both Admin and Members to view and update their personal profile information.

---

# 1. Profile View

## Fields Displayed
- Full Name
- Email (Read-only, usually changing email requires verification in Supabase)
- Role (Read-only)
- Joined Date

---

# 2. Update Profile

## Editable Fields
- Full Name

## Validation
- Name cannot be empty.

---

# 3. Change Password

## Fields
- New Password
- Confirm New Password

## Validation
- Passwords must match.
- Minimum 6 characters.

---

# 4. Loading States

```text
Updating profile...
Updating password...
```

---

# 5. Database Operations

Table: `users`
- Update (Name)

Supabase Auth:
- Update Password via `supabase.auth.updateUser()`

---

# 6. JavaScript

Create: `js/profile.js`

Responsibilities:
- Fetch current user data and populate form.
- Handle Name update form submission.
- Handle Password change form submission.
- Show success/error toast notifications.

---

# 7. Suggested Layout

```text
+------------------------------------------------------+
| My Profile                                           |
+------------------------------------------------------+
| Name:  [John Doe                 ]                   |
| Email: john@example.com (cannot change)              |
| Role:  Member                                        |
| [Update Profile]                                     |
+------------------------------------------------------+
| Change Password                                      |
| New Password:     [********]                         |
| Confirm Password: [********]                         |
| [Change Password]                                    |
+------------------------------------------------------+
```

---

# 8. Testing Checklist

- User can successfully change their display name.
- User can successfully change their password.
- Password validation works.
- Success messages appear on successful update.

---

# Definition of Done

- [ ] Profile view loaded with user data
- [ ] Name update functionality complete
- [ ] Password update functionality complete
- [ ] Validation and success states handled
