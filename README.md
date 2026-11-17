# LendLoop

A full-stack tool-lending platform that allows users to share tools, request loans for specific periods, and manage borrowing and lending activities.

LendLoop was built using Next.js, Clerk, Convex and n8n, with automated notifications through email, Discord and a mock notification channel.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [External Services Configuration](#external-services-configuration)
- [Notification Workflows](#notification-workflows)
- [Security Decisions](#security-decisions)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)

---

## Overview

LendLoop is a tool-sharing platform designed to make borrowing and lending equipment easier.

Users can publish tools they are willing to lend, browse available listings, request loans for specific date ranges, and manage their own lending and borrowing activities.

The platform includes an administrative interface for managing users, listings and trust status.

It also integrates n8n to automate notifications and daily overdue-loan reminders.

## Features

### Public features

- Browse publicly available tools.
- Filter tools by category.
- View tool descriptions, conditions and availability.
- Browse without creating an account.

### Authenticated user features

- Create, edit and manage tool listings.
- Request to borrow tools for specific date ranges.
- Approve or decline incoming loan requests.
- Withdraw pending loan requests.
- Mark approved loans as returned.
- View personal lending and borrowing activities.
- Track loan statuses and tool availability.

### Administrative features

- View all registered users.
- View all loan records.
- Remove any tool listing.
- Mark users as trusted or untrusted.
- Evaluate user trust using lending and borrowing history metrics.

### Automated notifications

Notifications are handled by n8n and support three channels:

- **Email:** Gmail SMTP.
- **Discord:** Discord incoming webhook.
- **Mock:** Simulated notification channel used for testing and execution tracking.

The application generates notifications for:

- New loan requests.
- Approved loan requests.
- Declined loan requests.
- Returned loans.

A separate scheduled workflow checks for overdue loans every day and sends reminders to borrowers.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Frontend and application framework |
| React 19 | User interface |
| TypeScript | Static typing |
| Ant Design | UI components |
| Tailwind CSS | Styling |
| Clerk | Authentication and user management |
| Convex | Database, backend functions and real-time data |
| n8n | Workflow automation and notifications |
| Gmail SMTP | Email notifications |
| Discord Webhooks | Discord notifications |
| Vitest | Automated testing |
| Docker Compose | n8n deployment |

---

## Architecture

LendLoop uses a separation of responsibilities between the frontend, authentication provider, backend and automation service.

### Application architecture

**Next.js**

Responsible for rendering the user interface, routing and client-side interactions.

**Clerk**

Handles authentication and provides user identity information. Clerk webhooks synchronize relevant user information with Convex.

**Convex**

Acts as the application's backend and source of truth for application data.

It handles:

- Database operations.
- User and role management.
- Tool listings.
- Loan requests and status transitions.
- Availability calculations.
- Administrative operations.
- Notification logs.
- Communication with n8n.

**n8n**

Handles external notification delivery and scheduled overdue-loan reminders.

### Loan notification flow

1. A user performs an action that changes a loan's state.
2. A Convex mutation validates the operation and updates the database.
3. Convex schedules an internal action that sends an event to the n8n webhook.
4. The event is authenticated using an HMAC SHA-256 signature.
5. n8n validates the signature.
6. The workflow separates the notification channels.
7. Email, Discord and mock notifications are processed independently.
8. n8n sends status callbacks to Convex.
9. Convex updates the corresponding notification logs.

### Overdue reminder flow

1. An n8n Schedule Trigger executes every day at 09:00.
2. n8n calls the Convex HTTP endpoint that retrieves overdue approved loans.
3. Convex creates or retrieves idempotent reminder logs for each loan and channel.
4. n8n processes the returned notification channels.
5. The borrower receives an email, Discord notification or mock notification.
6. n8n reports the outcome to Convex.
7. Convex updates the reminder logs.

All scheduled times use the `Indian/Antananarivo` timezone.

---

## Getting Started

### Prerequisites

Before running the project, install:

- Node.js (a compatible version for the project dependencies).
- pnpm.
- Git.
- A Clerk account.
- A Convex account.
- An n8n instance for notification workflows.

Docker and Docker Compose are recommended for running n8n locally.

### 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd lend-loop
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

Use the [Environment Variables](#environment-variables) section as a reference.

Never commit `.env.local` or real credentials to Git.

### 4. Configure Clerk

Create a Clerk application and obtain its publishable and secret keys.

Configure the Clerk webhook to synchronize user information with Convex.

The webhook must use the route implemented in the repository and its signing secret must be configured in the application's environment.

### 5. Configure Convex

Initialize or connect the project to a Convex deployment:

```bash
pnpm exec convex dev
```

Follow the CLI instructions to select or create a deployment.

Configure the required Convex environment variables in the Convex Dashboard.

Deploy the backend functions:

```bash
pnpm exec convex dev
```

For production deployments, use:

```bash
pnpm exec convex deploy
```

The frontend must use the Convex deployment URL corresponding to the selected environment.

### 6. Run the application

In a separate terminal:

```bash
pnpm dev
```

The application should be available at:

http://localhost:3000

For testing from another device on the local network:

```bash
pnpm dev --hostname 0.0.0.0
```

If using a LAN address with Next.js development mode, add the address to `allowedDevOrigins` in `next.config.ts`.

For example:

```ts
const nextConfig = {
  allowedDevOrigins: ["192.168.1.100"],
};

export default nextConfig;
```

Replace the example address with the development machine's actual IP address.

---

## Environment Variables

The following variables must be configured according to the services being used.

### Next.js application — `.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key used by the frontend. |
| `CLERK_SECRET_KEY` | Clerk secret key used by the server-side application. |
| `NEXT_PUBLIC_CONVEX_URL` | URL of the Convex deployment used by the frontend. |
| `CLERK_WEBHOOK_SECRET` | Secret used to verify incoming Clerk webhook events. |
| `N8N_WEBHOOK_URL` | Public production webhook URL of the n8n loan notification workflow. |
| `N8N_HMAC_SECRET` | Shared secret used to sign and verify Convex-to-n8n webhook requests. |
| `N8N_CALLBACK_SECRET` | Shared secret used to authenticate n8n callbacks to Convex. |

The exact Clerk webhook secret variable name and any additional variables must match the implementation in the repository.

### Convex environment variables

Configure the following in the Convex Dashboard:

| Variable | Description |
|---|---|
| `N8N_WEBHOOK_URL` | Public n8n loan notification webhook URL. |
| `N8N_HMAC_SECRET` | Secret used to sign outgoing webhook requests. |
| `N8N_CALLBACK_SECRET` | Secret used to authenticate incoming n8n callbacks. |

If the implementation also reads Clerk webhook configuration or other values from Convex, configure those as required by the backend code.

### n8n environment variables

When running n8n through Docker Compose, configure:

| Variable | Description |
|---|---|
| `GENERIC_TIMEZONE` | Workflow timezone. Use `Indian/Antananarivo`. |
| `TZ` | Container timezone. Use `Indian/Antananarivo`. |
| `N8N_WEBHOOK_URL` | Public base URL used to generate webhook URLs. |
| `N8N_EDITOR_BASE_URL` | Public URL of the n8n editor. |
| `N8N_PROXY_HOPS` | Number of reverse-proxy hops. Use `1` when running behind a single proxy. |
| `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS` | Enforces secure permissions on the n8n settings file. |

The n8n instance also requires credentials for:

- Gmail SMTP.
- Discord webhook.
- Convex HTTP callback authentication.

### Generating secrets

Generate independent random secrets for the HMAC and callback authentication:

```bash
openssl rand -hex 32
```

Do not reuse the same secret for different purposes.

The value of `N8N_HMAC_SECRET` must be identical wherever the signature is generated and verified.

The value of `N8N_CALLBACK_SECRET` must be identical in Convex and the n8n HTTP Request credentials.

Never publish actual secret values.

---

## External Services Configuration

### Clerk

1. Create a Clerk application.
2. Configure the application's authentication settings.
3. Add the Clerk keys to `.env.local`.
4. Configure a webhook pointing to the Clerk webhook endpoint implemented by the application.
5. Subscribe to the user events required by the synchronization implementation, including user creation and updates.
6. Configure the webhook signing secret.

Clerk is responsible for authentication, while Convex stores application-specific user information and roles.

### Convex

1. Create a Convex project.
2. Link the repository to the deployment.
3. Configure the environment variables.
4. Deploy the schema and backend functions.
5. Verify that the frontend uses the correct deployment URL.

Convex provides both the application backend and HTTP endpoints used by n8n.

The application uses Convex HTTP Actions for external integrations.

### n8n

The project uses two workflows:

- `LendLoop - Loan Notifications`
- The scheduled overdue-loan reminder workflow.

Import the exported workflow JSON files into an n8n instance.

After importing:

1. Configure the Gmail SMTP credential.
2. Configure the Discord webhook.
3. Configure the HTTP Request credentials used to authenticate callbacks to Convex.
4. Configure the HMAC credential used to verify incoming loan events.
5. Verify the Convex HTTP Actions URLs.
6. Verify the public n8n webhook URL.
7. Verify the Schedule Trigger timezone and execution time.
8. Publish both workflows.

**Important:** Production webhook executions use the published version of an n8n workflow. Changes made in the editor must be published before they become active.

### Gmail SMTP

Configure the Gmail SMTP credential using:

| Setting | Value |
|---|---|
| Host | `smtp.gmail.com` |
| Port | `465` |
| Security | SSL/TLS |
| Username | Your Gmail address |
| Password | Gmail App Password |

A Gmail App Password is required when using this configuration. Do not use your regular Google account password.

### Discord

1. Create a Discord server or choose an existing one.
2. Create a channel for LendLoop notifications.
3. Create an incoming webhook for that channel.
4. Add the webhook URL to the n8n Discord HTTP Request node.

Keep the Discord webhook URL private. Anyone possessing it can post messages to the associated channel.

---

## Notification Workflows

### Loan event notifications

The notification workflow handles:

| Event | Recipient |
|---|---|
| `loan_requested` | Tool owner |
| `loan_approved` | Borrower |
| `loan_declined` | Borrower |
| `loan_returned` | Borrower |

Each event is processed through the configured notification channels.

### Idempotency and retries

Each notification channel has an independent log entry.

Idempotency keys prevent duplicate notifications when the same event is processed more than once.

The workflow supports independent retries:

- Successful notifications are not resent.
- Pending notifications are not duplicated.
- Failed notifications can be retried.
- A failure in one channel does not prevent the other channels from being processed.

Notification statuses include:

- `pending`
- `sent`
- `failed`

### Overdue reminders

The reminder workflow runs daily at 09:00 in the `Indian/Antananarivo` timezone.

It retrieves approved loans whose end dates have passed and sends reminders to their borrowers.

Reminder idempotency is tracked by loan, date and channel, preventing duplicate reminders for the same loan on the same day.

Loans without a verified borrower email address are handled gracefully by the email branch rather than blocking the other notification channels.

---

## Security Decisions

### Authentication and authorization

- Clerk handles user authentication.
- Convex stores application roles and trust information.
- Authorization is enforced inside Convex functions, not only in the frontend.
- Administrative operations require an administrator role.
- Users cannot modify listings or loans belonging to other users unless explicitly authorized by the backend rules.

### Webhook security

Convex-to-n8n requests are authenticated using HMAC SHA-256 signatures.

The receiving workflow validates the signature before processing events.

n8n-to-Convex callbacks use a separate Bearer token secret.

This prevents unauthenticated clients from updating notification logs through the callback endpoint.

### Notification reliability

- Each channel is processed independently.
- Idempotency keys prevent duplicate delivery.
- Failed channels can be retried independently.
- Notification attempts and outcomes are recorded in Convex.

### Secret management

- API keys and webhook secrets are stored in environment variables or service credentials.
- Secrets must never be committed to source control.
- Different secrets are used for HMAC signing and callback authentication.
- Production credentials should be stored in the hosting platform's secret manager or environment configuration.

### Data and access control

- Public tool queries expose only the information intended for public users.
- Private user and loan information is protected by backend authorization checks.
- Loan date validation and overlapping-loan checks are enforced on the backend.
- Tool availability is maintained based on approved loan periods and status changes.

---

## Testing

Run the automated test suite:

```bash
pnpm test
```

Run the production build:

```bash
pnpm build
```

The build output is generated in the `.next/` directory.

For local development:

```bash
pnpm dev
```

For a local production-mode test:

```bash
pnpm build
pnpm start
```

The production server uses the generated build rather than the development server.

---

## Production Deployment

The application can be deployed using a hosting platform that supports Next.js, such as Vercel, with Convex deployed independently.

The following changes should be made before a production deployment.

### Next.js

- Configure production environment variables.
- Configure the production Clerk and Convex URLs.
- Remove development-only `allowedDevOrigins` entries that are no longer needed.
- Configure the production domain.
- Enable HTTPS.
- Run the production build in the deployment pipeline.

### Clerk

- Configure production API keys.
- Configure the production domain and allowed origins.
- Update webhook endpoints to use the production URL.
- Configure the production webhook signing secret.

### Convex

- Create or select a production deployment.
- Deploy the backend functions and schema.
- Configure production environment variables.
- Verify HTTP Action URLs.
- Ensure the frontend points to the production deployment.

### n8n

- Use a stable, publicly accessible HTTPS URL.
- Keep n8n authentication enabled.
- Configure production credentials and secrets.
- Update Convex webhook URLs to point to the production n8n instance.
- Update the callback credentials and URLs.
- Publish the production workflows.
- Ensure scheduled workflows remain active.
- Configure persistent storage and backups.
- Monitor workflow executions and failures.

### CI/CD

A deployment pipeline should:

1. Install dependencies.
2. Run automated tests.
3. Run the production build.
4. Deploy the Next.js application.
5. Deploy Convex backend changes when appropriate.

The n8n workflows should be version-controlled through their exported JSON files and imported or updated in the target n8n environment.

### Additional production considerations

Before operating the platform with real users, consider:

- Database backups and recovery procedures.
- Monitoring and alerting for failed workflows.
- Rate limiting and abuse prevention.
- Production email deliverability and sender-domain configuration.
- Proper retention and cleanup policies for logs.
- Secure management of n8n credentials.
- A stable hosting environment for n8n.
- A clear process for rotating webhook secrets.

---

## Project Structure

The main project directories are organized as follows:

```text
lend-loop/
├── app/                 # Next.js application routes and layouts
├── components/          # Reusable UI components
├── convex/              # Convex schema, queries, mutations and actions
├── public/              # Static assets
├── ...                  # Configuration and project files
├── .env.local           # Local environment variables (not committed)
├── .gitignore
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
└── README.md
```

The n8n workflow exports should also be included in the repository in a clearly named directory, for example:

```text
n8n/
├── lendloop-loan-notifications.json
└── lendloop-overdue-reminders.json
```

---

## License

Specify the applicable license here if the project is intended to be distributed under an open-source license.