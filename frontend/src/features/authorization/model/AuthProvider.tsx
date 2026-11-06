
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authApi, type User } from "../../../shared/api/auth";

const TOKEN_KEY = "bluepulse_token";

// Данные, доступные через контекст авторизации
export type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Выход из аккаунта
  const signOut = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  }, []);

  // Вход в аккаунт
  const signIn = useCallback(async (newToken: string) => {
    // Проверяем токен через backend
    const currentUser = await authApi.getMe(newToken);

    // Сохраняем токен после успешной проверки
    sessionStorage.setItem(TOKEN_KEY, newToken);

    setUser(currentUser);
    setToken(newToken);
  }, []);

  // Восстановление авторизации после обновления страницы
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedToken = sessionStorage.getItem(TOKEN_KEY);

      // Если токена нет, пользователь не авторизован
      if (!savedToken) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // Проверяем сохранённый токен на сервере
        const currentUser = await authApi.getMe(savedToken);

        if (!cancelled) {
          setUser(currentUser);
          setToken(savedToken);
        }
      } catch {
        if (!cancelled) {
          // При ошибке не удаляем сохранённый токен:
          // сервер может быть временно недоступен
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: user !== null,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
