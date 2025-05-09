# FinBuddy Implementation Guide

This guide provides a roadmap for implementing the FinBuddy Stealth-Blade architecture, with step-by-step instructions for each phase of development.

## Phase 1: Foundation Setup

### 1.1 Infrastructure Setup

1. **Kubernetes Cluster Setup**
   ```bash
   # Create base Terraform configuration
   terraform init
   terraform apply -target=module.k8s_cluster
   
   # Install Istio
   istioctl install --set profile=default
   ```

2. **CI/CD Pipeline**
   - Configure GitHub Actions for automated testing and deployment
   - Set up Docker registry for container images
   - Implement infrastructure-as-code validation

3. **Service Mesh Configuration**
   ```bash
   # Enable automatic sidecar injection
   kubectl label namespace finbuddy istio-injection=enabled
   
   # Apply mTLS strict mode
   kubectl apply -f - <<EOF
   apiVersion: security.istio.io/v1beta1
   kind: PeerAuthentication
   metadata:
     name: default
     namespace: finbuddy
   spec:
     mtls:
       mode: STRICT
   EOF
   ```

### 1.2 Core Services

1. **API Gateway (Stealth Proxy)**
   ```typescript
   // Sample NestJS API Gateway setup
   import { Module } from '@nestjs/common';
   import { GraphQLModule } from '@nestjs/graphql';
   import { APP_GUARD } from '@nestjs/core';
   import { JwtAuthGuard } from './auth/jwt-auth.guard';
   
   @Module({
     imports: [
       GraphQLModule.forRoot({
         autoSchemaFile: true,
         context: ({ req }) => ({ req }),
       }),
     ],
     providers: [
       {
         provide: APP_GUARD,
         useClass: JwtAuthGuard,
       },
     ],
   })
   export class AppModule {}
   ```

2. **Auth Blade**
   - Integrate with Keycloak/Auth0
   - Implement JWT validation
   - Create service account management

3. **Data Blade**
   - Set up encrypted PostgreSQL connection
   - Implement data access layer with encryption/decryption
   - Configure MinIO for object storage

## Phase 2: Core Blades Implementation

### 2.1 Financial Core

1. **Expense Blade**
   - Create transaction model and schema
   - Implement CRUD operations
   - Build CSV import/export functionality

2. **Budget Blade**
   - Implement budget rules engine
   - Create notification triggers
   - Build budget allocation logic

3. **Data Schema Example**
   ```typescript
   // Sample Expense Schema
   export class Expense {
     @PrimaryGeneratedColumn('uuid')
     id: string;
   
     @Column()
     @Transform(({ value }) => encryptField(value))
     amount: number;
   
     @Column()
     category: string;
   
     @Column()
     description: string;
   
     @Column()
     date: Date;
   
     @Column()
     @Transform(({ value }) => encryptField(value))
     paymentMethod: string;
   
     @ManyToOne(() => User, user => user.expenses)
     user: User;
   }
   ```

### 2.2 Event Bus Integration

1. **Event Bus Setup**
   ```typescript
   // RabbitMQ setup with NestJS
   import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
   
   @Module({
     imports: [
       RabbitMQModule.forRoot(RabbitMQModule, {
         exchanges: [
           {
             name: 'finbuddy',
             type: 'topic',
           },
         ],
         uri: 'amqp://rabbitmq.finbuddy:5672',
         connectionInitOptions: { wait: true },
         enableControllerDiscovery: true,
         encrypted: true, // Enable TLS
       }),
     ],
   })
   export class EventBusModule {}
   ```

2. **Event Producers and Consumers**
   - Implement event schema and validation
   - Create publisher patterns for each blade
   - Build consumer logic with error handling

## Phase 3: AI and Insights

### 3.1 AI Inference Blade

1. **Model Management**
   - Containerize LLM for Kubernetes deployment
   - Implement model versioning and delivery
   - Create inference API with FastAPI

2. **Context Injection**
   ```python
   # FastAPI context injection
   from fastapi import FastAPI, Depends, HTTPException
   from pydantic import BaseModel
   
   app = FastAPI()
   
   class PromptRequest(BaseModel):
       user_query: str
       user_id: str
   
   class EnrichedPrompt(BaseModel):
       prompt: str
       context: dict
   
   @app.post("/enrich", response_model=EnrichedPrompt)
   async def enrich_prompt(request: PromptRequest, auth=Depends(verify_service_auth)):
       # Fetch financial context from Data Blade
       context = await get_financial_context(request.user_id)
       
       # Construct prompt with context
       enriched_prompt = {
           "prompt": f"Given the following financial information: {context['summary']}, {request.user_query}",
           "context": context
       }
       
       return enriched_prompt
   ```

3. **Privacy-Preserving Features**
   - Implement data minimization techniques
   - Create sanitization filters for prompts
   - Build PII detection and redaction

### 3.2 Chat Blade

1. **Chat Session Management**
   - Create session persistence
   - Implement context tracking
   - Build streaming response handlers

2. **Frontend Integration**
   ```typescript
   // SvelteKit chat component
   <script lang="ts">
     import { chatStore } from '../stores/chat';
     import { user } from '../stores/auth';
     
     let query = '';
     let loading = false;
     
     async function sendMessage() {
       loading = true;
       await chatStore.sendMessage({
         content: query,
         userId: $user.id,
         timestamp: new Date()
       });
       query = '';
       loading = false;
     }
   </script>
   
   <div class="chat-container">
     {#each $chatStore.messages as message}
       <div class={message.isUser ? 'user-message' : 'ai-message'}>
         {message.content}
       </div>
     {/each}
     
     <form on:submit|preventDefault={sendMessage}>
       <input bind:value={query} placeholder="Ask FinBuddy..." />
       <button type="submit" disabled={loading}>Send</button>
     </form>
   </div>
   ```

## Phase 4: Sync and Offline Support

### 4.1 Sync Blade

1. **Sync Protocol Implementation**
   - Create conflict resolution strategy
   - Implement differential sync
   - Build data versioning

2. **Offline-First Features**
   ```typescript
   // SvelteKit offline store
   import { writable } from 'svelte/store';
   import { browser } from '$app/environment';
   
   export const createOfflineSyncStore = (name, initialValue) => {
     // Load from IndexedDB if available
     const getInitialValue = async () => {
       if (!browser) return initialValue;
       
       try {
         const db = await openDB('finbuddy', 1);
         const storedValue = await db.get('offlineData', name);
         return storedValue || initialValue;
       } catch (e) {
         console.error('Failed to load offline data', e);
         return initialValue;
       }
     };
     
     const store = writable(initialValue);
     
     // Initialize from IndexedDB
     if (browser) {
       getInitialValue().then(store.set);
     }
     
     // Sync function for when online
     const sync = async () => {
       if (navigator.onLine) {
         const currentValue = get(store);
         try {
           const response = await fetch(`/api/sync/${name}`, {
             method: 'POST',
             body: JSON.stringify(currentValue),
             headers: { 'Content-Type': 'application/json' }
           });
           const serverData = await response.json();
           store.set(mergeData(currentValue, serverData));
         } catch (e) {
           console.error('Sync failed', e);
         }
       }
     };
     
     return {
       ...store,
       sync
     };
   };
   ```

## Phase 5: Security Hardening

### 5.1 Zero-Trust Implementation

1. **Network Policies**
   ```yaml
   # Example K8s Network Policy for Expense Blade
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: expense-blade-network-policy
     namespace: finbuddy
   spec:
     podSelector:
       matchLabels:
         app: expense-blade
     policyTypes:
     - Ingress
     - Egress
     ingress:
     - from:
       - podSelector:
           matchLabels:
             app: api-gateway
       - podSelector:
           matchLabels:
             app: data-blade
       ports:
       - protocol: TCP
         port: 3000
     egress:
     - to:
       - podSelector:
           matchLabels:
             app: data-blade
       ports:
       - protocol: TCP
         port: 3000
     - to:
       - podSelector:
           matchLabels:
             app: event-bus
       ports:
       - protocol: TCP
         port: 5672
   ```

2. **Security Headers**
   ```typescript
   // API Gateway security headers
   import helmet from 'helmet';
   
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         imgSrc: ["'self'", 'data:'],
         connectSrc: ["'self'"],
         fontSrc: ["'self'"],
         objectSrc: ["'none'"],
         mediaSrc: ["'none'"],
         frameSrc: ["'none'"],
       }
     },
     xssFilter: true,
     hsts: {
       maxAge: 31536000,
       includeSubDomains: true,
       preload: true
     }
   }));
   ```

3. **Data Encryption**
   ```typescript
   // Field-level encryption utility
   import * as crypto from 'crypto';
   
   export class EncryptionService {
     private readonly algorithm = 'aes-256-gcm';
     private readonly keyVault: KeyVault;
     
     constructor(keyVault: KeyVault) {
       this.keyVault = keyVault;
     }
     
     async encrypt(userId: string, data: string): Promise<EncryptedData> {
       const userKey = await this.keyVault.getUserKey(userId);
       const iv = crypto.randomBytes(16);
       const cipher = crypto.createCipheriv(this.algorithm, userKey, iv);
       
       let encrypted = cipher.update(data, 'utf8', 'hex');
       encrypted += cipher.final('hex');
       const authTag = cipher.getAuthTag();
       
       return {
         iv: iv.toString('hex'),
         encryptedData: encrypted,
         authTag: authTag.toString('hex')
       };
     }
     
     async decrypt(userId: string, encryptedData: EncryptedData): Promise<string> {
       const userKey = await this.keyVault.getUserKey(userId);
       const decipher = crypto.createDecipheriv(
         this.algorithm, 
         userKey, 
         Buffer.from(encryptedData.iv, 'hex')
       );
       
       decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
       
       let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
       decrypted += decipher.final('utf8');
       
       return decrypted;
     }
   }
   ```

## Phase 6: Deployment & Observability

### 6.1 Helm Charts

```yaml
# Example Helm chart structure
finbuddy/
├── charts/
│   ├── api-gateway/
│   ├── auth-blade/
│   ├── expense-blade/
│   ├── budget-blade/
│   ├── insights-blade/
│   ├── chat-blade/
│   ├── ai-inference/
│   ├── sync-blade/
│   ├── notification-blade/
│   ├── data-blade/
│   ├── postgresql/
│   └── minio/
├── Chart.yaml
└── values.yaml
```

### 6.2 Monitoring Setup

1. **Prometheus Configuration**
   ```yaml
   # prometheus.yaml
   scrape_configs:
     - job_name: 'istio-mesh'
       kubernetes_sd_configs:
       - role: pod
       relabel_configs:
       - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
         action: keep
         regex: true
       - source_labels: [__meta_kubernetes_pod_annotation_sidecar_istio_io_status]
         action: keep
     
     - job_name: 'finbuddy-services'
       kubernetes_sd_configs:
       - role: pod
         namespaces:
           names:
           - finbuddy
       relabel_configs:
       - source_labels: [__meta_kubernetes_pod_label_app]
         regex: .*blade.*
         action: keep
   ```

2. **Grafana Dashboards**
   - Create service mesh dashboard
   - Build blade-specific monitoring
   - Implement security monitoring

## Getting Started

### Local Development Environment

```bash
# Start local development environment
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Start frontend dev server
npm run dev

# Create local database
npm run db:setup
```

### Deployment Steps

```bash
# Build and push Docker images
./scripts/build-push.sh

# Deploy to Kubernetes
helm install finbuddy ./charts/finbuddy

# Verify deployment
kubectl get pods -n finbuddy
```

## Testing Strategy

1. **Unit Testing**
   - Each blade should have comprehensive unit tests
   - Mock external dependencies
   - Verify business logic integrity

2. **Integration Testing**
   - Test blade-to-blade interactions
   - Verify event processing
   - Test data consistency

3. **Security Testing**
   - Regular penetration testing
   - Automated vulnerability scanning
   - Compliance verification

## Conclusion

This implementation guide provides a roadmap for building the FinBuddy system using the Stealth-Blade architecture. By following this phased approach, you can create a secure, modular, and privacy-focused financial assistant that operates in both online and offline environments.