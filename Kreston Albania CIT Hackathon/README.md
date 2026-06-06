# KrestonFlow AI — MVP Final Touch Version

KrestonFlow AI is a professional internal CRM, workflow, and role-safe AI Copilot MVP for a professional services firm. It is designed around the Kreston Albania requirements: centralized role-based login, hierarchical visibility, Client 360, workflow approvals, document control, Business Development, restricted Finance/HR modules, dashboards, notifications, audit logging, and future AI analytics.

## How to run

No `npm install` is required.

```powershell
node serve.cjs
```

Or double-click:

```text
START_WINDOWS.bat
```

Then open the localhost URL printed in the terminal, usually:

```text
http://localhost:5173
```

## Demo accounts

Password for all accounts:

```text
Kreston2026!
```

Accounts:

- `admin@kreston.demo`
- `partner@kreston.demo`
- `manager.audit@kreston.demo`
- `senior.audit@kreston.demo`
- `associate.audit@kreston.demo`
- `junior.audit@kreston.demo`
- `intern@kreston.demo`
- `manager.tax@kreston.demo`
- `finance@kreston.demo`
- `hr@kreston.demo`
- `marketing@kreston.demo`

## MVP-ready workflow

1. Admin logs in and creates users.
2. Manager/Senior creates and assigns a client task.
3. Junior logs in and sees only assigned work.
4. Junior starts and submits the task.
5. Senior sees it in the new Review Queue.
6. Senior approves or sends the task back.
7. Manager/Partner can monitor the status through Dashboard, Workflow, and Client 360.
8. Audit Trail records the actions.
9. Gemini Copilot answers only from the current user's permitted role scope.

## What was finalized in this MVP version

- Added a dedicated **Review Queue** module for Senior/Manager/Partner/Admin.
- Strengthened role-based navigation and blocked restricted route access.
- Improved user switching: login/logout clears old Copilot chat, selected records, filters, modals, and previous user context.
- Improved Copilot safety: restricted questions are blocked and logged before being sent to Gemini.
- Improved document access rules: Finance, HR, Contract, and Proposal document types are hidden unless authorized.
- Improved BD visibility and calculations to use only visible proposals for the current role.
- Added BD-to-Client-360 handoff: when a proposal becomes `Contract Signed`, a Client 360 record/onboarding task is created or updated.
- Improved task workflow validation: lower roles cannot approve their own tasks or force restricted statuses.
- Added “Send Back” review action.
- Restricted Finance and HR create actions to authorized roles only.
- Cleaned duplicated document form button.
- Added safer role-scoped export in Settings.
- Kept the project dependency-free for live hackathon stability.

## Gemini setup

Edit `.env`:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
PORT=5173
```

Put your Gemini key after `GEMINI_API_KEY=` and restart the server.

If no key is configured, the app uses safe local fallback responses.

## Important MVP limitations

This is a functional MVP/hackathon prototype, not a production system yet.

Production version should add:

- PostgreSQL/SQL Server database instead of localStorage
- hashed passwords and real backend sessions/JWT
- server-side RBAC for every data endpoint
- real file upload/download and document preview
- real WebSocket notifications
- Microsoft 365 integration
- Caseware and Financa 5 connectors
- encrypted storage, backups, audit retention, and GDPR controls

## Recommended demo flow

1. Login as Admin and show all modules.
2. Open Admin Center and show role hierarchy.
3. Open Client 360 and show one client journey.
4. Create a task for Junior.
5. Login as Junior and show restricted sidebar.
6. Submit task.
7. Login as Senior and open Review Queue.
8. Approve/send back task.
9. Login as Partner/Admin and show Audit Trail.
10. Open Copilot and ask a role-safe management question.


## Added in the structured KAI chatbot version

- Added a floating **KAI Copilot** button on every logged-in page.
- KAI uses the same role-safe Copilot engine as the full Gemini Copilot module.
- The chatbot works with or without a Gemini API key:
  - With `GEMINI_API_KEY`, it calls the backend `/api/copilot` route.
  - Without a key, it uses the local fallback engine so the demo still works during the hackathon.
- KAI quick prompts change by role:
  - Junior/Associate users get task and quality-help prompts.
  - Senior/Manager/Partner/Admin users get executive, client risk, workload, and MVP prompts.
- The full app structure remains unchanged: `index.html` + `styles.css` + `app.js` + `serve.cjs`.

## Files changed for KAI

- `app.js` — added floating chatbot rendering, send/quick prompt actions, and shared chat state with the full Copilot page.
- `styles.css` — added professional floating chatbot styles.
- `README.md` and `TEST_REPORT.md` — updated notes for the structured MVP version.
