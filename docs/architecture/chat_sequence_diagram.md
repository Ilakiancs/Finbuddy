# FinBuddy Chat Flow Sequence Diagram

This diagram illustrates the sequence of interactions when a user asks a question to FinBuddy through the chat interface.

```mermaid
sequenceDiagram
    participant User
    participant SvelteKit as SvelteKit Frontend
    participant Gateway as API Gateway
    participant ChatBlade as Chat Blade
    participant ContextInjector as Context Injector
    participant AI as AI Inference Blade
    participant DataBlade as Data Blade
    participant EventBus as Event Bus
    participant NotificationBlade as Notification Blade
    participant DB as PostgreSQL/MinIO
    
    User->>SvelteKit: Types question in chat
    
    alt Offline Mode
        SvelteKit->>SvelteKit: Check for offline mode
        SvelteKit->>SvelteKit: Use on-device LLM (future capability)
        SvelteKit-->>User: Stream response to user
    else Online Mode
        SvelteKit->>Gateway: POST /api/chat (with JWT)
        Gateway->>Gateway: Validate JWT & rate limits
        Gateway->>ChatBlade: Forward authenticated request (mTLS)
        
        ChatBlade->>ChatBlade: Create chat session
        ChatBlade->>EventBus: Publish chat.started event
        
        ChatBlade->>ContextInjector: Request context enrichment
        ContextInjector->>DataBlade: Request user financial data (mTLS)
        DataBlade->>DB: Query encrypted data
        DB-->>DataBlade: Return encrypted data
        DataBlade->>DataBlade: Decrypt data
        DataBlade-->>ContextInjector: Return financial context
        
        ContextInjector->>ContextInjector: Build prompt with context
        ContextInjector-->>ChatBlade: Return enriched prompt
        
        ChatBlade->>AI: Send enriched prompt (mTLS)
        
        AI->>AI: Tokenize prompt
        AI->>AI: Run inference
        
        AI-->>ChatBlade: Stream tokens (SSE/WebSockets)
        ChatBlade-->>Gateway: Stream response (SSE/WebSockets)
        Gateway-->>SvelteKit: Stream response to client
        SvelteKit-->>User: Display streaming response
        
        ChatBlade->>EventBus: Publish chat.completed event
        EventBus->>NotificationBlade: Process relevant insights
        NotificationBlade->>NotificationBlade: Check insight thresholds
        
        alt Insight Generated
            NotificationBlade->>User: Send push notification (if applicable)
        end
        
        ChatBlade->>DataBlade: Store conversation history (mTLS)
        DataBlade->>DB: Encrypt and store
    end
```

## Key Security Features in the Flow

1. **Authentication & Authorization**
   - JWT validation at API Gateway
   - mTLS for all service-to-service communication

2. **Data Privacy**
   - All financial data encrypted at rest in PostgreSQL/MinIO
   - Data decryption occurs only within authorized Data Blade
   - Context injection performed in isolated service

3. **Zero-Trust Implementation**
   - Each service validates the identity of calling services
   - Least privilege access to data and resources
   - No direct database access from external-facing services

4. **Offline-First Capability**
   - Client determines whether to use local processing or cloud services
   - Sync protocol ensures data consistency when reconnecting

5. **Streaming Architecture**
   - Response tokens streamed from AI to user for responsive experience
   - Event-driven architecture for asynchronous processing