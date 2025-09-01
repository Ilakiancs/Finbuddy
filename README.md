# FinBuddy – Privacy-first AI financial assistant

FinBuddy is a privacy-first, AI-powered personal finance assistant built on a modern microservices architecture designed for security and reliability.

## Core principles

- **Privacy first**: your financial data stays under your control  
- **Zero trust**: every service assumes the network is untrusted  
- **Offline first**: works with or without internet access  
- **AI insights**: financial guidance without compromising privacy  

## Architecture

FinBuddy uses a modular "blade" architecture, where each capability is isolated in its own secure microservice.

### Frontend
- SvelteKit progressive web app with offline support  
- End-to-end encryption for sensitive data  

### API layer
- Proxy gateway (NestJS/Fastify) with TLS termination  
- Service mesh (Istio) for mutual TLS and policy enforcement  

### Core blades
- **Auth**: user authentication and authorization  
- **Expenses**: track spending, categories, import/export  
- **Budget**: rules engine and alerts  
- **Insights**: AI-powered spending analysis and predictions  
- **Goals**: financial goal setting and tracking  
- **Chat**: natural language interface  
- **AI inference**: private LLM processing  
- **Sync**: secure data synchronization  
- **Notifications**: alerts and reminders  
- **Data**: encrypted data access layer  

### Data storage
- PostgreSQL for encrypted structured data  
- MinIO for object storage (embeddings, backups)  

## Security features

- Mutual TLS between all services  
- Data encrypted at rest and in transit  
- Minimal public attack surface  
- Service-to-service authentication  
- Field-level encryption for sensitive data  
- Network isolation policies  

## Documentation

Architecture details can be found in the `docs/architecture` directory:

- [C4 container diagram](docs/architecture/c4_container_diagram.md)  
- [Chat sequence diagram](docs/architecture/chat_sequence_diagram.md)  
- [Zero-trust implementation](docs/architecture/stealth_zero_trust.md)  

## Tech stack

- Frontend: SvelteKit, TypeScript  
- API gateway: Node.js, NestJS/Fastify  
- Microservices: Node.js (NestJS), Python (FastAPI)  
- Data: PostgreSQL, MinIO  
- Event bus: RabbitMQ/Kafka  
- Service mesh: Istio  
- Authentication: OAuth2/JWT via Keycloak or Auth0  
- Containerization: Docker, Kubernetes  
- Infrastructure: Terraform, Helm  

## Roadmap

- Mobile app via SvelteKit PWA  
- On-device LLM inference (Ollama/CoreML)  
- Privacy features using differential privacy  
- OCR for financial documents  
- Multi-account aggregation  

## License

TBD
