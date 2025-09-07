import { createContext } from "react";
import type { Session, User } from "better-auth";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
});

// React Router context for middleware
export const userContext = Symbol("user");
export const sessionContext = Symbol("session");
