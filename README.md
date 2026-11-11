# CareerPilot

<p align="center">
  <strong>An AI-powered career preparation and placement-readiness platform for students and early-career candidates.</strong>
</p>

<p align="center">
  <a href="https://apnacareerpilot.netlify.app"><strong>🚀 Live Preview</strong></a>
  ·
  <a href="https://github.com/arya-brahmadev/mycareerpilot">Source Code</a>
</p>

CareerPilot brings interview practice, communication training, career planning, application tracking and practical workplace simulations into one workspace.

> **Live application:** [https://apnacareerpilot.netlify.app](https://apnacareerpilot.netlify.app)

## Features

### Interview preparation
- HR interview practice with structured questions and feedback.
- AI Interview Room / Interview Intelligence for reviewing performance.
- Interview attempt history and saved evaluations.

### Communication labs
- Speaking practice.
- Professional writing exercises.
- Reading comprehension and reading aloud.
- Listening comprehension activities.

### Career planning and readiness
- Personalised role-based learning roadmaps.
- Daily Plan for organising study and preparation tasks.
- Daily Challenge practice.
- Job Readiness insights.
- Application Tracker for monitoring job applications.

### Practical learning
- Real-world workplace and problem-solving simulations.
- Guided exercises designed to connect preparation with practical situations.

Feature availability may depend on the connected AppDeploy services and the user's authentication state.

## Technology

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** CSS, Tailwind CSS, PostCSS
- **Icons:** Lucide React
- **Document processing:** PDF.js
- **Application services:** AppDeploy SDK (authentication, AI, database and realtime functionality)

## Repository structure

```text
.
├── appdeploy.auth-login.json
├── backend/
│   ├── index.ts
│   ├── realtime.ts
│   └── realtime-subscribers.ts
├── index.html
├── package.json
├── postcss.config.js
├── public/
│   └── _redirects
├── src/
│   ├── App.tsx
│   ├── ApplicationsTracker.*
│   ├── DailyChallenge.*
│   ├── DailyPlan.*
│   ├── HRInterview.*
│   ├── InterviewIntelligence.*
│   ├── JobReadiness.tsx
│   ├── ListeningLab.*
│   ├── ReadingLab.*
│   ├── RealWorldSimulator.*
│   ├── RealWorldWorkbench.*
│   ├── SpeakingLab.*
│   ├── WritingLab.*
│   ├── index.css
│   └── main.tsx
├── tailwind.config.js
├── tests/tests.json
├── tsconfig.json
└── vite.config.ts
```

## Live deployment and routing

The public Netlify URL is:

**[https://apnacareerpilot.netlify.app](https://apnacareerpilot.netlify.app)**

The Netlify `public/_redirects` rule proxies incoming paths to the currently hosted AppDeploy application:

```text
/* https://careerpilot-53kxvz.v2.appdeploy.ai/:splat 200
```

This is a reverse proxy, not a migration of the backend. The browser stays on the Netlify domain while the existing AppDeploy-hosted application continues to provide its runtime services. The AppDeploy origin therefore remains a dependency of the live deployment.

## Running locally

The frontend is a Vite application. With a compatible AppDeploy development/runtime environment and its SDK aliases available:

```bash
npm install
npm run dev
```

Create a production frontend build:

```bash
npm run build
npm run preview
```

The Vite production output is written to `dist/`.

### AppDeploy runtime dependency

Some application modules import `@appdeploy/client` and the backend imports `@appdeploy/sdk`. These are AppDeploy platform integrations, not standalone browser packages configured in this repository's public npm dependency list. Running the complete application outside AppDeploy requires configuring equivalent authentication, AI, database, realtime and API services and updating those integrations. A plain static Vite build or the Netlify proxy rule alone does not migrate those backend services.

## Deployment notes

- The Netlify rewrite is stored in `public/_redirects`, which Vite copies to the production output.
- The Netlify site must publish the built `dist` directory if using a Git-based build.
- The currently published Netlify URL proxies to AppDeploy; it is not evidence that the AppDeploy backend has been migrated to Netlify.
- Keep API keys, OAuth client secrets, service credentials and private environment files out of Git. Configure secrets in the relevant hosting provider's environment settings.
- Google sign-in and other AppDeploy-managed capabilities require their corresponding provider-side configuration.

## Development status

This repository contains the application source snapshot exported from CareerPilot's AppDeploy project. The backend source is included for reference and platform deployment; it is not independently hosted by this static Netlify rewrite.

## License

No open-source license has been added yet. Unless a license is added, standard copyright applies and reuse is not automatically granted.
