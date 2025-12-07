import apiClient from './api';
import { LoginCredentials, AuthResponse, User, Location, TokenRefreshQueue } from '@/types/auth';

class AuthService {
  private static instance: AuthService;
  private tokenRefreshPromise: Promise<string> | null = null;
  private failedQueue: TokenRefreshQueue[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // Store token securely
      this.setToken(response.token);
      
      // Store user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('permissions', JSON.stringify(response.user.permissions));
        localStorage.setItem('locations', JSON.stringify(response.user.locations));
        
        // Set current location
        const currentLocation = response.user.locations.find(
          (loc: Location) => loc.id === response.location_id
        ) || response.user.locations.find((loc: Location) => loc.is_primary) || response.user.locations[0];
        
        if (currentLocation) {
          localStorage.setItem('currentLocation', JSON.stringify(currentLocation));
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async me(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/auth/profile');
    
    // Update stored data
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('permissions', JSON.stringify(response.user.permissions));
      localStorage.setItem('locations', JSON.stringify(response.user.locations));
      
      // Update current location if needed
      const currentLocation = this.getCurrentLocation();
      if (!currentLocation && response.user.locations.length > 0) {
        const primaryLocation = response.user.locations.find((loc: Location) => loc.is_primary) || response.user.locations[0];
        if (primaryLocation) {
          localStorage.setItem('currentLocation', JSON.stringify(primaryLocation));
        }
      }
    }

    return response.user;
  }

  async refreshToken(): Promise<string> {
    // Prevent multiple refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();
    
    try {
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      const response = await apiClient.post<{ token: string; token_type: string }>('/auth/refresh');
      this.setToken(response.token);
      
      // Process queued requests
      this.processQueue(null, response.token);
      
      return response.token;
    } catch (error) {
      this.processQueue(error, null);
      this.clearAuthData();
      throw error;
    }
  }

  async switchLocation(locationId: string): Promise<void> {
    try {
      await apiClient.post('/auth/switch-location', { location_id: locationId });
      
      // Update current location in storage
      if (typeof window !== 'undefined') {
        const locations = this.getStoredLocations();
        const newLocation = locations.find((loc: Location) => loc.id === locationId);
        if (newLocation) {
          localStorage.setItem('currentLocation', JSON.stringify(newLocation));
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async fetchLocations(): Promise<Location[]> {
    try {
      const response = await apiClient.get<{ locations: Location[]; primary_location_id?: string }>('/auth/locations');
      
      // Update stored locations
      if (typeof window !== 'undefined') {
        localStorage.setItem('locations', JSON.stringify(response.locations));
        
        // Update current location if primary location changed
        if (response.primary_location_id) {
          const primaryLocation = response.locations.find((loc: Location) => loc.id === response.primary_location_id);
          if (primaryLocation) {
            localStorage.setItem('currentLocation', JSON.stringify(primaryLocation));
          }
        }
      }
      
      return response.locations;
    } catch (error) {
      throw error;
    }
  }

  async setPrimaryLocation(locationId: string): Promise<void> {
    try {
      await apiClient.post('/auth/set-primary-location', { location_id: locationId });
      
      // Update stored locations
      if (typeof window !== 'undefined') {
        const locations = this.getStoredLocations();
        const updatedLocations = locations.map((loc: Location) => ({
          ...loc,
          is_primary: loc.id === locationId
        }));
        localStorage.setItem('locations', JSON.stringify(updatedLocations));
        
        // Update current location
        const newPrimaryLocation = updatedLocations.find((loc: Location) => loc.id === locationId);
        if (newPrimaryLocation) {
          localStorage.setItem('currentLocation', JSON.stringify(newPrimaryLocation));
        }
      }
    } catch (error) {
      throw error;
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try cookie first, then localStorage
    const cookieToken = this.getCookie('auth_token');
    if (cookieToken) return cookieToken;
    
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    // Store in both cookie and localStorage for flexibility
    const isSecure = process.env.NODE_ENV === 'production';
    document.cookie = `auth_token=${token}; path=/; ${isSecure ? 'secure;' : ''} samesite=strict; max-age=7200`;
    localStorage.setItem('auth_token', token);
  }

  clearAuthData(): void {
    if (typeof window === 'undefined') return;
    
    // Clear cookies
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('locations');
    localStorage.removeItem('currentLocation');
  }

  private getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private processQueue(error: unknown, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  // Get stored data
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  getPermissions(): string[] {
    if (typeof window === 'undefined') return [];
    const permissions = localStorage.getItem('permissions');
    return permissions ? JSON.parse(permissions) : [];
  }

  getStoredLocations(): Location[] {
    if (typeof window === 'undefined') return [];
    const locations = localStorage.getItem('locations');
    return locations ? JSON.parse(locations) : [];
  }

  getLocations(): Location[] {
    return this.getStoredLocations();
  }

  getCurrentLocation(): Location | null {
    if (typeof window === 'undefined') return null;
    const currentLocation = localStorage.getItem('currentLocation');
    return currentLocation ? JSON.parse(currentLocation) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!(this.getToken() && this.getUser());
  }

  // Check if token is expired (simple check)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      // Simple JWT token parsing (for expiration check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

export const authService = AuthService.getInstance();