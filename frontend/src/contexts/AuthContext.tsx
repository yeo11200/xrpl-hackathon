import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../types/auth";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string | null>(null);

  // 로컬 스토리지에서 로그인 상태 복원
  useEffect(() => {
    const savedNickname = localStorage.getItem("userNickname");
    if (savedNickname) {
      setNickname(savedNickname);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userNickname: string) => {
    setNickname(userNickname);
    setIsAuthenticated(true);
    localStorage.setItem("userNickname", userNickname);
  };

  const logout = () => {
    setNickname(null);
    setIsAuthenticated(false);
    localStorage.removeItem("userNickname");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, nickname, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
