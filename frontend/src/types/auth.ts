import { createContext } from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  nickname: string | null;
  login: (nickname: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
