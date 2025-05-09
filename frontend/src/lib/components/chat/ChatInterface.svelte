<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createSyncStore } from '$lib/stores/offline';
  import { auth, user } from '$lib/stores/auth';
  import { networkStatus } from '$lib/stores/offline';

  // Define types for chat messages
  interface ChatMessage {
    id: string;
    content: string;
    timestamp: Date;
    isUser: boolean;
    isPending?: boolean;
  }

  // Chat history store with offline sync
  const chatHistory = createSyncStore<ChatMessage[]>('chat_history', []);

  // Local state
  let messageInput = '';
  let isLoading = false;
  let chatContainer: HTMLElement;
  let eventSource: EventSource | null = null;
  let currentMessage: ChatMessage | null = null;

  // Subscribe to chat history changes
  const unsubscribe = chatHistory.subscribe(data => {
    // Auto-scroll to bottom when messages change
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
  });

  onMount(() => {
    // Initial load of chat history if needed
    if (chatHistory.getData().length === 0) {
      loadChatHistory();
    }

    // Set up keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  onDestroy(() => {
    // Clean up event source if active
    if (eventSource) {
      eventSource.close();
    }
    
    // Unsubscribe from store
    unsubscribe();
  });

  async function loadChatHistory() {
    if (!$networkStatus.online || !$auth.isAuthenticated) {
      return;
    }

    try {
      const response = await fetch('/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${$auth.token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        chatHistory.set(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  async function sendMessage() {
    if (!messageInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: messageInput,
      timestamp: new Date(),
      isUser: true
    };

    // Add user message to chat immediately
    chatHistory.update(messages => [...messages, userMessage]);
    
    // Clear input field
    const userQuery = messageInput;
    messageInput = '';
    
    // Add placeholder for AI response
    const placeholderResponse: ChatMessage = {
      id: crypto.randomUUID(),
      content: '...',
      timestamp: new Date(),
      isUser: false,
      isPending: true
    };
    
    currentMessage = placeholderResponse;
    chatHistory.update(messages => [...messages, placeholderResponse]);
    
    // Check if we have network connectivity
    if (!$networkStatus.online || !$networkStatus.backendAvailable) {
      processOfflineQuery(userQuery, placeholderResponse.id);
      return;
    }

    // Process with online API
    isLoading = true;
    try {
      // Close any existing connection
      if (eventSource) {
        eventSource.close();
      }

      // Set up server-sent events for streaming response
      eventSource = new EventSource(`/api/chat/stream?message=${encodeURIComponent(userQuery)}&token=${$auth.token}`);
      let responseContent = '';
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'token') {
            // Append new token to response
            responseContent += data.content;
            
            // Update the message in chat
            chatHistory.update(messages => 
              messages.map(msg => 
                msg.id === placeholderResponse.id
                  ? { ...msg, content: responseContent, isPending: true }
                  : msg
              )
            );
          } 
          else if (data.type === 'end') {
            // Finalize the message
            chatHistory.update(messages => 
              messages.map(msg => 
                msg.id === placeholderResponse.id
                  ? { ...msg, content: responseContent, isPending: false }
                  : msg
              )
            );
            
            // Close the connection
            eventSource.close();
            eventSource = null;
            isLoading = false;
            
            // Save to server
            saveMessageToServer(userQuery, responseContent);
          }
        } catch (error) {
          console.error('Error processing stream:', error);
        }
      };

      eventSource.onerror = () => {
        // Handle connection error
        eventSource.close();
        eventSource = null;
        isLoading = false;
        
        // Update message to show error
        chatHistory.update(messages => 
          messages.map(msg => 
            msg.id === placeholderResponse.id
              ? { 
                  ...msg, 
                  content: 'Sorry, there was an error connecting to FinBuddy. Please try again.', 
                  isPending: false 
                }
              : msg
          )
        );
      };
      
    } catch (error) {
      console.error('Error sending message:', error);
      isLoading = false;
      
      // Update placeholder with error message
      chatHistory.update(messages => 
        messages.map(msg => 
          msg.id === placeholderResponse.id
            ? { 
                ...msg, 
                content: 'Sorry, there was an error. Please try again.', 
                isPending: false 
              }
            : msg
        )
      );
    }
  }
  
  async function saveMessageToServer(userQuery: string, aiResponse: string) {
    if (!$networkStatus.online || !$auth.isAuthenticated) return;
    
    try {
      await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$auth.token}`
        },
        body: JSON.stringify({
          userMessage: userQuery,
          aiResponse: aiResponse,
          timestamp: new Date()
        })
      });
    } catch (error) {
      console.error('Failed to save chat message:', error);
    }
  }

  function processOfflineQuery(query: string, responseId: string) {
    // Simple offline responses for basic queries
    // In the future, this could use an on-device LLM
    let response = "I'm currently in offline mode and can't process complex questions. ";
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
      response += "I can help you track expenses, set budgets, and provide financial insights when online.";
    } 
    else if (lowerQuery.includes('expense') || lowerQuery.includes('spend')) {
      response += "You can view your recent expenses in the Expenses tab, even while offline.";
    }
    else if (lowerQuery.includes('budget')) {
      response += "Your budget information is available in the Budget tab, which works offline.";
    }
    else {
      response += "Please check your connection and try again, or use the app's direct features which work offline.";
    }
    
    // Update the placeholder message with our offline response
    setTimeout(() => {
      chatHistory.update(messages => 
        messages.map(msg => 
          msg.id === responseId
            ? { ...msg, content: response, isPending: false }
            : msg
        )
      );
      isLoading = false;
    }, 500);
  }

  function clearChat() {
    chatHistory.set([]);
    
    if ($networkStatus.online && $auth.isAuthenticated) {
      fetch('/api/chat/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${$auth.token}`
        }
      }).catch(error => {
        console.error('Failed to clear chat history on server:', error);
      });
    }
  }
</script>

<div class="chat-container">
  <div class="chat-header">
    <h2>FinBuddy Assistant</h2>
    <div class="chat-actions">
      <button class="clear-button" on:click={clearChat} disabled={isLoading}>
        Clear Chat
      </button>
      <div class="status-indicator" class:online={$networkStatus.online}>
        {$networkStatus.online ? 'Online' : 'Offline'} Mode
      </div>
    </div>
  </div>

  <div class="messages" bind:this={chatContainer}>
    {#if chatHistory.getData().length === 0}
      <div class="welcome-message">
        <h3>Welcome to FinBuddy!</h3>
        <p>Your privacy-first AI financial assistant. Ask me anything about your finances.</p>
        <div class="sample-questions">
          <p>Try asking:</p>
          <button class="question-button" on:click={() => messageInput = "How much did I spend on groceries this month?"}>
            How much did I spend on groceries this month?
          </button>
          <button class="question-button" on:click={() => messageInput = "What's my current budget status?"}>
            What's my current budget status?
          </button>
          <button class="question-button" on:click={() => messageInput = "Give me tips to save money on subscriptions."}>
            Give me tips to save money on subscriptions.
          </button>
        </div>
      </div>
    {:else}
      {#each chatHistory.getData() as message}
        <div class="message {message.isUser ? 'user-message' : 'ai-message'}" class:pending={message.isPending}>
          <div class="message-avatar">
            {#if message.isUser}
              <div class="user-avatar">
                {($user?.name?.[0] || 'U').toUpperCase()}
              </div>
            {:else}
              <div class="ai-avatar">FB</div>
            {/if}
          </div>
          <div class="message-content">
            <div class="message-text">{message.content}</div>
            <div class="message-time">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <form class="message-input" on:submit|preventDefault={sendMessage}>
    <input
      type="text"
      bind:value={messageInput}
      placeholder="Ask FinBuddy anything about your finances..."
      disabled={isLoading}
    />
    <button type="submit" disabled={isLoading || !messageInput.trim()}>
      {#if isLoading}
        <span class="spinner"></span>
      {:else}
        Send
      {/if}
    </button>
  </form>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background-color: #fcfcfc;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: #0066cc;
    color: white;
  }

  .chat-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .clear-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  }

  .clear-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .status-indicator {
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 12px;
    background-color: #ff3b30;
    color: white;
  }

  .status-indicator.online {
    background-color: #34c759;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .message {
    display: flex;
    margin-bottom: 15px;
    animation: fadeIn 0.3s ease-in-out;
  }

  .user-message {
    justify-content: flex-end;
  }

  .ai-message {
    justify-content: flex-start;
  }

  .message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    flex-shrink: 0;
    font-weight: bold;
  }

  .user-avatar {
    background-color: #0066cc;
    color: white;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .ai-avatar {
    background-color: #34c759;
    color: white;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .user-message .message-avatar {
    order: 2;
    margin-right: 0;
    margin-left: 10px;
  }

  .message-content {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    position: relative;
  }

  .user-message .message-content {
    background-color: #0066cc;
    color: white;
    border-bottom-right-radius: 4px;
  }

  .ai-message .message-content {
    background-color: #f1f1f1;
    color: #333;
    border-bottom-left-radius: 4px;
  }

  .pending .message-content {
    background-color: #e8e8e8;
  }

  .message-text {
    line-height: 1.4;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .message-time {
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: 5px;
    text-align: right;
  }

  .welcome-message {
    text-align: center;
    padding: 30px;
    max-width: 600px;
    margin: auto;
  }

  .sample-questions {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .question-button {
    background-color: #f1f1f1;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    margin: 5px;
    cursor: pointer;
    transition: background-color 0.2s;
    text-align: left;
    width: 80%;
  }

  .question-button:hover {
    background-color: #e3e3e3;
  }

  .message-input {
    display: flex;
    padding: 15px;
    background-color: #fff;
    border-top: 1px solid #eee;
  }

  .message-input input {
    flex: 1;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 24px;
    margin-right: 10px;
    font-size: 1rem;
  }

  .message-input button {
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 24px;
    padding: 0 20px;
    cursor: pointer;
    min-width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .message-input button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>