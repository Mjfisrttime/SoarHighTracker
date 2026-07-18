# Phase 1 – Project Setup (MVP)

## Objective

Set up the development environment, initialize the project, connect it to Supabase, and prepare the database. By the end of this phase, the project should have a working structure and a successful connection to Supabase.

---

# 1. Create the Project

## Tasks

- Create the project folder
- Create the HTML pages
- Create CSS and JavaScript folders
- Organize assets and reusable components

## Suggested Structure

```text
company-tracker/
│
├── index.html                 # Redirect/Login Landing
├── login.html
├── register.html
├── dashboard.html
│
├── css/
│   ├── style.css
│   ├── login.css
│   ├── dashboard.css
│   └── components.css
│
├── js/
│   ├── supabase.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── utils.js
│   └── config.js
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── logo/
│
└── components/
    ├── navbar.html
    ├── sidebar.html
    └── footer.html
```

---

# 2. Create Supabase Project

Create a new Supabase project.

Configure:

- Project Name
- Region
- Database Password

After creation, copy:

- Project URL
- Anon Public Key

These values will be used to connect the frontend application.

---

# 3. Connect HTML to Supabase

Create:

```text
js/supabase.js
```

Responsibilities:

- Initialize the Supabase Client
- Export the client instance
- Test the database connection

Expected Result:

```text
✓ Connected to Supabase
```

---

# 4. Configure Authentication

Enable:

- Email Authentication

Disable for now:

- Google Login
- GitHub Login
- Magic Links

Only use:

- Email
- Password

---

# 5. Create Initial Database Tables

Create the following tables.

## users

```text
id
name
email
role
created_at
```

## groups

```text
id
group_name
description
created_by
created_at
```

## group_members

```text
id
group_id
user_id
joined_at
```

## attendance

```text
id
group_id
user_id
date
status
remarks
```

## task_logs

```text
id
user_id
group_id
title
description
date_completed
```

---

# 6. Enable Row Level Security (RLS)

For the MVP:

- Enable RLS on every table.
- Create simple authenticated-user policies for development.

Security can be refined later.

---

# 7. Test Database

Verify that you can:

- Insert a user
- Read users
- Insert a group
- Read groups

If these operations succeed, the project is successfully connected to Supabase.

---

# 8. Prepare Shared JavaScript Files

## config.js

Store:

- Application Name
- Version

## utils.js

Store helper functions:

- Format Date
- Toast Notifications
- Loading Spinner

## auth.js

Prepare functions for:

- Login
- Register
- Logout
- Session Check

Implementation will be completed in Phase 2.

---

# 9. Initialize Git

Initialize a Git repository.

Suggested commits:

```text
Initial Project Setup
Connected Supabase
Created Database Schema
Configured Project Structure
```

---

# Definition of Done

Phase 1 is complete when:

- [ ] Project folder structure created
- [ ] HTML, CSS, and JavaScript folders organized
- [ ] Supabase project created
- [ ] Frontend connected to Supabase
- [ ] Email/Password authentication enabled
- [ ] Database tables created
- [ ] Row Level Security enabled
- [ ] Database connection tested
- [ ] Git repository initialized

---

# Out of Scope

Do **not** build these yet:

- Login functionality
- Registration functionality
- Dashboard
- Group Management
- Member Management
- Attendance Module
- Task Logs
- Reports
- User Profile

These will be implemented in the following phases.
