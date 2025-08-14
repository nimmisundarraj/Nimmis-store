// src/auth/tokenManager.ts
import { Auth, User, getAuth, onAuthStateChanged, IdTokenResult } from 'firebase/auth';

type TokenRefreshListener = (token: string) => void;

class TokenManager {
  private auth: Auth;
  private currentUser: User | null;
  private refreshInterval: NodeJS.Timeout | null;
  private tokenExpiryTime: number | null;
  private listeners: TokenRefreshListener[];

  constructor() {
    this.auth = getAuth();
    this.currentUser = null;
    this.refreshInterval = null;
    this.tokenExpiryTime = null;
    this.listeners = [];
    
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.startTokenRefreshMonitor();
      } else {
        this.currentUser = null;
        this.stopTokenRefreshMonitor();
      }
    });
  }
  
  private startTokenRefreshMonitor(): void {
    this.stopTokenRefreshMonitor();
    
    this.refreshInterval = setInterval(async () => {
      try {
        if (this.currentUser) {
          const tokenResult: IdTokenResult = await this.currentUser.getIdTokenResult();
          const expirationTime: number = new Date(tokenResult.expirationTime).getTime();
          const now: number = Date.now();
          const fiveMinutes: number = 5 * 60 * 1000;
          
          if (expirationTime - now < fiveMinutes) {
            console.log('Token expiring soon, refreshing...');
            const newToken: string = await this.currentUser.getIdToken(true);
            this.notifyTokenRefreshed(newToken);
          }
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }, 10 * 60 * 1000);
  }
  
  private stopTokenRefreshMonitor(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  public async getToken(): Promise<string | null> {
    if (!this.currentUser) {
      return null;
    }
    
    try {
      return await this.currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
  
  public async refreshToken(): Promise<string | null> {
    if (!this.currentUser) {
      return null;
    }
    
    try {
      const newToken: string = await this.currentUser.getIdToken(true);
      this.notifyTokenRefreshed(newToken);
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
  
  public addTokenRefreshListener(listener: TokenRefreshListener): void {
    this.listeners.push(listener);
  }
  
  public removeTokenRefreshListener(listener: TokenRefreshListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  private notifyTokenRefreshed(newToken: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(newToken);
      } catch (error) {
        console.error('Error in token refresh listener:', error);
      }
    });
  }
}

const tokenManager = new TokenManager();
export default tokenManager;