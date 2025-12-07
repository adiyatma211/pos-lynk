export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  two_factor_enabled: boolean;
  roles: string[];
  permissions: string[];
  locations: Location[];
  primary_location_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  address?: string;
  timezone?: string;
  currency?: string;
  tax_rate?: number;
  is_primary?: boolean;
  is_active?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  location_id?: string;
  remember?: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  token_type: string;
  location_id?: string;
  expires_at?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  locations: Location[];
  currentLocation: Location | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  switchLocation: (locationId: string) => Promise<void>;
  hasPermission: (permission: string, locationId?: string) => boolean;
  hasAnyPermission: (permissions: string[], locationId?: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export interface Permission {
  id: string;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
  status?: number;
  data?: unknown;
}

export interface TokenRefreshQueue {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}