export interface User {
  id: string;
  email: string;
  username?: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  role: 'customer' | 'admin';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
}
