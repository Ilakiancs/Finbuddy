# FinBuddy - Privacy-First AI Financial Assistant

FinBuddy is a privacy-first AI-powered personal finance assistant built on a modern Stealth-Blade microservices architecture.

## 🛡️ Core Principles

- **Privacy First**: Your financial data never leaves your control
- **Zero Trust**: Every component assumes the network is hostile
- **Offline First**: Works with or without internet connectivity
- **AI-Powered**: Smart financial insights without privacy compromises

## 🏗️ Architecture

FinBuddy is built on a Stealth-Blade architecture, where each capability is isolated in its own secure "blade" microservice:

### Frontend
- **SvelteKit SPA**: Progressive Web App with offline capabilities
- **End-to-end Encryption**: Client-side encryption for sensitive data

### API Layer
- **Stealth Proxy Gateway**: NestJS/Fastify with TLS termination
- **Service Mesh**: Istio for mTLS and zero-trust enforcement

### Core Blades
- **Auth Blade**: User authentication and authorization
- **Expense Blade**: Track expenses, categories, import/export
- **Budget Blade**: Budget rules engine and alerts
- **Insights Blade**: AI-powered spending analysis and predictions
- **Goal Blade**: Financial goal setting and tracking
- **Chat Blade**: Natural language interface to your finances
- **AI Inference Blade**: LLM inference with privacy protection
- **Sync Blade**: Secure cloud synchronization
- **Notification Blade**: Alerts and notifications
- **Data Blade**: Encrypted data access layer

### Data Storage
- **PostgreSQL**: Encrypted financial data storage
- **MinIO**: Object storage for embeddings and backups

## 🚀 Getting Started

*Coming soon...*

## 🔐 Security Features

- mTLS between all services
- Data encrypted at rest and in transit
- Minimal public attack surface
- Service-to-service authentication
- Field-level encryption for sensitive data
- Strict network isolation policies

## 📊 Architecture Diagrams

Review the architecture documentation in the `docs/architecture` directory:

- [C4 Container Diagram](docs/architecture/c4_container_diagram.md)
- [Chat Sequence Diagram](docs/architecture/chat_sequence_diagram.md)
- [Zero-Trust Implementation](docs/architecture/stealth_zero_trust.md)

## 🧩 Technology Stack

- **Frontend**: SvelteKit, TypeScript
- **API Gateway**: Node.js, NestJS/Fastify
- **Microservices**: TypeScript/Node.js (NestJS), Python (FastAPI)
- **Data Storage**: PostgreSQL, MinIO
- **Event Bus**: RabbitMQ/Kafka
- **Service Mesh**: Istio
- **Authentication**: OAuth2/JWT via Keycloak or Auth0
- **Containerization**: Docker, Kubernetes
- **IaC**: Terraform, Helm

## 🌟 Future Roadmap

- Mobile app via SvelteKit PWA
- On-device LLM inference with Ollama/CoreML
- Enhanced privacy features with differential privacy
- Financial document OCR processing
- Multi-account aggregation
i

## 💼 License

*TBD*
