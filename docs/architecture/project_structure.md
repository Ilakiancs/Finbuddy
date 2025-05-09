# FinBuddy Project Structure

This document outlines the recommended project structure for the FinBuddy application based on the Stealth-Blade architecture.

## Root Directory Structure

```
finbuddy/
├── frontend/                  # SvelteKit Frontend
├── gateway/                   # API Gateway (Stealth Proxy)
├── blades/                    # Core Blade Microservices
├── infrastructure/            # Infrastructure as Code
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
├── tools/                     # Development tools
└── README.md                  # Main documentation
```

## Frontend Structure

```
frontend/
├── src/
│   ├── lib/                   # Shared components and utilities
│   │   ├── components/        # UI components
│   │   │   ├── expense/
│   │   │   ├── budget/
│   │   │   ├── insights/
│   │   │   └── chat/
│   │   ├── stores/            # Svelte stores
│   │   │   ├── auth.ts
│   │   │   ├── expenses.ts
│   │   │   ├── budget.ts
│   │   │   └── offline.ts
│   │   └── utils/             # Utility functions
│   │       ├── encryption.ts
│   │       ├── sync.ts
│   │       └── api.ts
│   ├── routes/                # SvelteKit routes
│   ├── app.html               # Main HTML template
│   └── service-worker.ts      # Service worker for offline mode
├── static/                    # Static assets
├── tests/                     # Frontend tests
├── svelte.config.js
└── package.json
```

## API Gateway Structure

```
gateway/
├── src/
│   ├── main.ts                # Entry point
│   ├── app.module.ts          # Main module
│   ├── auth/                  # Auth handling
│   │   ├── jwt.strategy.ts
│   │   └── auth.guard.ts
│   ├── proxy/                 # Proxy rules and routing
│   │   ├── blade-router.ts
│   │   └── rate-limiter.ts
│   └── config/                # Gateway configuration
│       ├── istio.config.ts
│       └── security.config.ts
├── test/                      # Gateway tests
├── Dockerfile
└── package.json
```

## Blades Structure

```
blades/
├── auth-blade/                # Authentication Blade
│   ├── src/
│   │   ├── main.ts
│   │   ├── users/
│   │   └── tokens/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── expense-blade/             # Expense Tracking Blade
│   ├── src/
│   │   ├── main.ts
│   │   ├── transactions/
│   │   ├── categories/
│   │   └── imports/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── budget-blade/              # Budget Management Blade
│   ├── src/
│   │   ├── main.ts
│   │   ├── budgets/
│   │   └── rules/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── insights-blade/            # Financial Insights Blade
│   ├── src/
│   │   ├── main.ts
│   │   ├── analysis/
│   │   └── predictions/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── goal-blade/                # Financial Goals Blade
│   ├── src/
│   │   ├── main.ts
│   │   ├── goals/
│   │   └── progress/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── chat-blade/                # Chat Interface Blade
│   ├── src/
│   │   ├── main.ts
│   │   ├── sessions/
│   │   └── context/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── ai-inference/              # AI Inference Blade (Python)
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   └── inference/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── sync-blade/                # Data Synchronization Blade
│   ├── src/
│   │   ├── main.ts
│   │   ├── sync/
│   │   └── conflict/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
├── notification-blade/        # Notification Blade
│   ├── src/
│   │   ├── main.ts
│   │   ├── channels/
│   │   └── templates/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
│
└── data-blade/                # Data Access Blade
    ├── src/
    │   ├── main.ts
    │   ├── crypto/
    │   └── repositories/
    ├── test/
    ├── Dockerfile
    └── package.json
```

## Infrastructure Structure

```
infrastructure/
├── terraform/                 # Terraform IaC
│   ├── main.tf
│   ├── modules/
│   │   ├── cluster/
│   │   ├── database/
│   │   └── networking/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── kubernetes/                # Kubernetes configurations
│   ├── base/                  # Base configurations
│   │   ├── namespaces/
│   │   ├── network-policies/
│   │   └── security/
│   └── overlays/              # Environment-specific overlays
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── helm/                      # Helm charts
│   ├── finbuddy/              # Main chart
│   └── charts/                # Sub-charts for each blade
│
└── docker/                    # Docker-related files
    ├── base/
    └── images/
```

## Documentation Structure

```
docs/
├── architecture/              # Architecture documentation
│   ├── c4_container_diagram.md
│   ├── chat_sequence_diagram.md
│   ├── stealth_zero_trust.md
│   ├── stealth_blade_pattern.md
│   ├── implementation_guide.md
│   └── project_structure.md
│
├── api/                       # API documentation
│   ├── gateway.md
│   ├── expense-blade.md
│   ├── budget-blade.md
│   └── ...
│
├── development/               # Development guides
│   ├── setup.md
│   ├── testing.md
│   └── contributing.md
│
└── deployment/                # Deployment guides
    ├── kubernetes.md
    ├── helm.md
    └── terraform.md
```

## Scripts Structure

```
scripts/
├── setup/                     # Setup scripts
│   └── dev-environment.sh
│
├── build/                     # Build scripts
│   ├── build-all.sh
│   └── build-blade.sh
│
├── deploy/                    # Deployment scripts
│   ├── deploy-all.sh
│   └── deploy-blade.sh
│
└── ci/                        # CI/CD scripts
    ├── test.sh
    ├── build.sh
    └── deploy.sh
```

## Development Tools

```
tools/
├── generators/                # Code generators
│   └── blade-generator/
│
├── migration/                 # Database migration tools
│   └── schema-updater/
│
└── security/                  # Security tools
    └── key-generator/
```

This structure provides a scalable foundation for the FinBuddy application, with clear separation between different components according to the Stealth-Blade architecture principles.