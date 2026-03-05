import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "user" | "creator" | "admin";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  verified?: boolean;
  bio?: string;
  category?: string;
  price?: number;
  followers?: number;
  subscribers?: number;
}

const testUsers: Record<string, { password: string; user: User }> = {
  "admin@gmail.com": {
    password: "admin",
    user: {
      id: "1",
      name: "Admin Master",
      username: "admin",
      email: "admin@gmail.com",
      role: "admin",
      verified: true,
    },
  },
  "luna@email.com": {
    password: "123456",
    user: {
      id: "2",
      name: "Luna Dark",
      username: "lunadark",
      email: "luna@email.com",
      role: "creator",
      verified: true,
      bio: "Fotógrafa profissional & criadora de conteúdo. Compartilhando arte exclusiva, bastidores e ensaios premium. 📸",
      category: "Fotografia",
      price: 39.90,
      followers: 45200,
      subscribers: 1247,
    },
  },
  "marcus@email.com": {
    password: "123456",
    user: {
      id: "3",
      name: "Marcus Vibe",
      username: "marcusvibe",
      email: "marcus@email.com",
      role: "creator",
      verified: true,
      bio: "Produtor musical e artista independente 🎵",
      category: "Música",
      price: 29.90,
      followers: 32100,
      subscribers: 892,
    },
  },
  "joao@email.com": {
    password: "123456",
    user: {
      id: "4",
      name: "João Silva",
      username: "joaosilva",
      email: "joao@email.com",
      role: "user",
    },
  },
  "maria@email.com": {
    password: "123456",
    user: {
      id: "5",
      name: "Maria Santos",
      username: "mariasantos",
      email: "maria@email.com",
      role: "user",
    },
  },
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isCreator: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isAdmin: false,
  isCreator: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("fanvault_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email: string, password: string): boolean => {
    const entry = testUsers[email.toLowerCase()];
    if (entry && entry.password === password) {
      setUser(entry.user);
      localStorage.setItem("fanvault_user", JSON.stringify(entry.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("fanvault_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.role === "admin",
        isCreator: user?.role === "creator",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
