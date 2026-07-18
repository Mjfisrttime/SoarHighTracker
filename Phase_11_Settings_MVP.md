# Phase 11 – Settings (MVP)

## Objective

Provide a central place for application-level settings and account actions.

---

# 1. Features

- **Account Management**: Link to Profile page.
- **Theme Preferences** (Optional for MVP): Toggle Light/Dark mode.
- **Logout Action**: Prominent button to end the session.
- **System Information**: Display app version.

---

# 2. Logout Workflow

- Call `supabase.auth.signOut()`
- Clear any local storage/session storage variables.
- Redirect to `login.html`.

---

# 3. JavaScript

Create: `js/settings.js`

Responsibilities:
- Handle Theme toggling (saving preference in `localStorage`).
- Handle Logout execution (can reuse from `auth.js`).

---

# 4. Suggested Layout

```text
+------------------------------------------------------+
| Settings                                             |
+------------------------------------------------------+
| [👤 Go to Profile Settings ]                         |
+------------------------------------------------------+
| Theme: (•) Light   ( ) Dark                          |
+------------------------------------------------------+
| App Version: 1.0.0-MVP                               |
+------------------------------------------------------+
| [🚪 Logout]                                          |
+------------------------------------------------------+
```

---

# 5. Testing Checklist

- User can navigate to Profile.
- (If implemented) Theme toggle applies and persists on reload.
- Logout successfully clears session and redirects.

---

# Definition of Done

- [ ] Settings page structure complete
- [ ] Logout functionality verified
- [ ] Theme toggle (if implemented) works
