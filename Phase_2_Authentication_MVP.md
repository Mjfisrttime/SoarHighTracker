# Phase 2 – Authentication (MVP)

## Objective

Implement a secure authentication system using Supabase Auth so users can register, log in, maintain a session, and log out.

---

# 1. Authentication Pages

Create:

- login.html
- register.html

Optional:
- forgot-password.html (future)

---

# 2. Registration

## Fields

- Full Name
- Email
- Password
- Confirm Password

## Validation

- All fields required
- Valid email
- Passwords match
- Minimum password length
- Prevent duplicate email registration

## Success

- Create Supabase Auth account
- Create user profile record
- Redirect to Login

---

# 3. Login

## Fields

- Email
- Password

## Features

- Authenticate with Supabase
- Show error on invalid credentials
- Redirect to Dashboard after login

---

# 4. Session Management

On every protected page:

- Check if user is logged in
- Redirect unauthenticated users to login
- Keep active session

---

# 5. Logout

- Sign out from Supabase
- Clear local session
- Redirect to Login

---

# 6. User Profile Creation

After successful registration, insert a record into the users table.

Fields:

```text
id
name
email
role
created_at
```

Default role:

```text
Member
```

Admin accounts can be created manually during development.

---

# 7. Authentication Utilities

## auth.js

Functions:

- registerUser()
- loginUser()
- logoutUser()
- checkSession()
- getCurrentUser()

---

# 8. UI States

Registration

- Loading state
- Success message
- Error message

Login

- Loading state
- Login failed message
- Redirect after success

---

# 9. Route Protection

Protected pages:

- dashboard.html
- groups.html
- attendance.html
- task-logs.html
- reports.html
- profile.html

Public pages:

- index.html
- login.html
- register.html

---

# 10. Testing Checklist

- Register new account
- Prevent duplicate email
- Login successfully
- Reject incorrect password
- Session persists after refresh
- Logout works
- Protected pages require login

---

# Definition of Done

- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Session validation works
- [ ] User profile saved in database
- [ ] Protected routes implemented
- [ ] Validation and error messages completed

---

# Out of Scope

Do not build yet:

- Dashboard widgets
- Group management
- Attendance
- Task logs
- Reports
- Password reset
- Email verification
- Social login
