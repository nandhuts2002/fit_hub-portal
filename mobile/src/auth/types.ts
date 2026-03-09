export type AuthUser = {
  id: string;
  email: string;
  role: 'user' | 'trainer' | 'admin' | string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

