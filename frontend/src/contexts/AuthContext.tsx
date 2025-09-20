import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../types/auth";
import type { XRPLAccount } from "../service/account.service";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [xrplAccount, setXrplAccount] = useState<XRPLAccount | null>(
    JSON.parse(localStorage.getItem("xrpl_account")) || null
  );

  // 로컬 스토리지에서 로그인 상태 복원
  useEffect(() => {
    const savedNickname = localStorage.getItem("userNickname");
    const savedAccount = localStorage.getItem("xrpl_account");

    if (savedNickname) {
      setNickname(savedNickname);
      setIsAuthenticated(true);
    }

    if (savedAccount) {
      setXrplAccount(JSON.parse(savedAccount));
    }
  }, []);

  const login = (userNickname: string, account: XRPLAccount) => {
    setNickname(userNickname);
    setXrplAccount(account);
    setIsAuthenticated(true);
    localStorage.setItem("userNickname", userNickname);
    localStorage.setItem("xrpl_account", JSON.stringify(account));
  };

  const logout = () => {
    setNickname(null);
    setXrplAccount(null);
    setIsAuthenticated(false);
    localStorage.removeItem("userNickname");
    localStorage.removeItem("xrpl_account");
    localStorage.removeItem("xrpl_seed"); // SEED도 함께 제거
  };

  const contextValue = {
    isAuthenticated,
    nickname,
    xrplAccount,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
