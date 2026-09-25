export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
