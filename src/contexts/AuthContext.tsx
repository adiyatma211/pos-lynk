'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthContextType, User, Location, LoginCredentials } from '@/types/auth';
import { authService } from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user && token);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authService.getToken();
        const storedUser = authService.getUser();
        const storedPermissions = authService.getPermissions();
        const storedLocations = authService.getLocations();
        const storedCurrentLocation = authService.getCurrentLocation();

        if (storedToken && storedUser) {
          // Validate token with server
          try {
            const currentUser = await authService.me();
            setUser(currentUser);
            setToken(storedToken);
            setPermissions(storedPermissions);
            setLocations(storedLocations);
            setCurrentLocation(storedCurrentLocation || storedLocations[0] || null);
          } catch (error) {
            console.error('Token validation failed:', error);
            // Token invalid, clear auth data
            authService.clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      
      setUser(response.user);
      setToken(response.token);
      setPermissions(response.user.permissions);
      setLocations(response.user.locations);
      
      // Set current location
      const selectedLocation = response.user.locations.find(
        (loc: Location) => loc.id === response.location_id
      ) || response.user.locations.find((loc: Location) => loc.is_primary) || response.user.locations[0];
      
      setCurrentLocation(selectedLocation || null);
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setPermissions([]);
      setLocations([]);
      setCurrentLocation(null);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const newToken = await authService.refreshToken();
      setToken(newToken);
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  }, [logout]);

  const switchLocation = useCallback(async (locationId: string) => {
    try {
      await authService.switchLocation(locationId);
      
      const newLocation = locations.find(loc => loc.id === locationId);
      if (newLocation) {
        setCurrentLocation(newLocation);
      }
    } catch (error) {
      throw error;
    }
  }, [locations]);

  const hasPermission = useCallback((permission: string, locationId?: string): boolean => {
    if (!permissions.length) return false;
    
    // Check global permissions
    const hasGlobalPermission = permissions.includes(permission);
    if (hasGlobalPermission && !locationId) return true;
    
    // For location-specific permissions, we'd need to implement this logic
    // This would require backend support for location-scoped permissions
    return hasGlobalPermission;
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: string[], locationId?: string): boolean => {
    return perms.some(perm => hasPermission(perm, locationId));
  }, [hasPermission]);

  const hasRole = useCallback((role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  }, [user?.roles]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const value: AuthContextType = {
    user,
    token,
    permissions,
    locations,
    currentLocation,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    switchLocation,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};