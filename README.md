# KrestonFlow AI

KrestonFlow AI is a hackathon MVP CRM and internal workflow management platform designed for accounting and consulting firms. The project demonstrates how role-based access, workflow automation, client management, review queues, audit tracking, and an AI-powered assistant can improve internal company operations.

This project was created as a demo solution for the Kreston Albania CIT Hackathon. It is intended for presentation, learning, and portfolio purposes, not as a production-ready business system.

## Features

* Role-based login and dashboard views
* Hierarchical access control for Admin, Partner, Manager, Senior, Associate, Junior, and Intern roles
* Client 360 module for client information and activity tracking
* Task and workflow management
* Review Queue for task approval and send-back actions
* Business Development pipeline
* Internal Finance, HR, and Marketing modules
* Document access rules based on user role and department
* Audit Trail for tracking important user actions
* Floating KAI Copilot assistant
* Gemini API support with local fallback responses
* Demo accounts for testing different roles

## Tech Stack

* HTML5
* CSS3
* JavaScript
* Node.js
* Gemini API integration
* LocalStorage for MVP data persistence

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/krestonflow-ai.git
cd krestonflow-ai
```

### 2. Start the application

```bash
npm start
```

Or run directly:

```bash
node serve.cjs
```

Then open:

```text
http://localhost:5173
```

## Demo Accounts

All demo accounts use the same password:

```text
Kreston2026!
```

| Role              | Email                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Admin             | [admin@kreston.demo](mailto:admin@kreston.demo)                     |
| Partner           | [partner@kreston.demo](mailto:partner@kreston.demo)                 |
| Audit Manager     | [manager.audit@kreston.demo](mailto:manager.audit@kreston.demo)     |
| Audit Senior      | [senior.audit@kreston.demo](mailto:senior.audit@kreston.demo)       |
| Audit Associate   | [associate.audit@kreston.demo](mailto:associate.audit@kreston.demo) |
| Audit Junior      | [junior.audit@kreston.demo](mailto:junior.audit@kreston.demo)       |
| Intern            | [intern@kreston.demo](mailto:intern@kreston.demo)                   |
| Tax Manager       | [manager.tax@kreston.demo](mailto:manager.tax@kreston.demo)         |
| Finance Manager   | [finance@kreston.demo](mailto:finance@kreston.demo)                 |
| HR Manager        | [hr@kreston.demo](mailto:hr@kreston.demo)                           |
| Marketing Manager | [marketing@kreston.demo](mailto:marketing@kreston.demo)             |

## MVP Limitations

This project is a functional hackathon MVP, but it is not production-ready yet. A production version should include a real database, secure authentication, backend role validation, real file handling, encrypted storage, and enterprise-level audit controls.


## Disclaimer

This project was built as a hackathon prototype and portfolio demo. It is not an official production system of Kreston Albania or any related organization.
