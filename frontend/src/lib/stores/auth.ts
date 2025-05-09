import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  notifications: boolean;
  offlineMode: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initialize auth state from localStorage if available
const storedToken = browser ? localStorage.getItem('auth_token') : null;
const storedUser = browser ? localStorage.getItem('auth_user') : null;

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  loading: false,
  error: null,
  isAuthenticated: !!storedToken
};

// Create auth store
const authStore = writable<AuthState>(initialState);

// Helper functions
async function loginWithEmail(email: string, password: string): Promise<void> {
  authStore.update(state => ({ ...state, loading: true, error: null }));
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    
    if (browser) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
    
    authStore.update(state => ({
      ...state,
      user: data.user,
      token: data.token,
      loading: false,
      isAuthenticated: true
    }));
    
  } catch (error) {
    authStore.update(state => ({
      ...state, 
      loading: false,
      error: error.message,
      isAuthenticated: false
    }));
  }
}

async function register(email: string, password: string, name: string): Promise<void> {
  authStore.update(state => ({ ...state, loading: true, error: null }));
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    const data = await response.json();
    
    if (browser) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
    
    authStore.update(state => ({
      ...state,
      user: data.user,
      token: data.token,
      loading: false,
      isAuthenticated: true
    }));
    
  } catch (error) {
    authStore.update(state => ({
      ...state, 
      loading: false,
      error: error.message,
      isAuthenticated: false
    }));
  }
}

async function logout(): Promise<void> {
  // Call logout API
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${get(authStore).token}`
      }
    });
  } catch (error) {
    console.error('Logout API error:', error);
  }
  
  // Clear local storage
  if (browser) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
  
  // Reset state
  authStore.set({
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false
  });
  
  // Redirect to login page
  goto('/login');
}

async function updateUserProfile(updates: Partial<User>): Promise<void> {
  const { token } = get(authStore);
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  authStore.update(state => ({ ...state, loading: true, error: null }));
  
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Profile update failed');
    }
    
    const updatedUser = await response.json();
    
    if (browser) {
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
    
    authStore.update(state => ({
      ...state,
      user: updatedUser,
      loading: false
    }));
    
  } catch (error) {
    authStore.update(state => ({
      ...state, 
      loading: false,
      error: error.message
    }));
  }
}

// For components that only need to check authentication status
export const isAuthenticated = derived(
  authStore,
  $authStore => $authStore.isAuthenticated
);

// For components that need the user object
export const user = derived(
  authStore,
  $authStore => $authStore.user
);

// Auth actions for export
export const auth = {
  subscribe: authStore.subscribe,
  loginWithEmail,
  register,
  logout,
  updateUserProfile
};

function get(store) {
  let value;
  const unsubscribe = store.subscribe(s => value = s);
  unsubscribe();
  return value;
}