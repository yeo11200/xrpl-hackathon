import { createContext } from "react";
import type { XRPLAccount } from "../service/account.service";

export interface AuthContextType {
  isAuthenticated: boolean;
  nickname: string | null;
  xrplAccount: XRPLAccount | null;
  login: (nickname: string, account: XRPLAccount) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
