
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authApi, type User } from "../../../shared/api/auth";

const TOKEN_KEY = "bluepulse_token";

// Данные для изменения профиля
export type ProfileUpdateData = {
  full_name: string;
  email: string;
  phone: string | null;
};

// Данные, доступные через контекст авторизации
export type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string) => Promise<User>;
  signOut: () => void;
  updateProfile: (data: ProfileUpdateData) => Promise<User>;
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
  const signIn = useCallback(async (newToken: string): Promise<User> => {
    // Проверяем токен через backend
    const currentUser = await authApi.getMe(newToken);

    // Сохраняем токен после успешной проверки
    sessionStorage.setItem(TOKEN_KEY, newToken);

    setUser(currentUser);
    setToken(newToken);

    // Возвращаем пользователя, чтобы форма входа узнала его роль
    return currentUser;
  }, []);

  // Обновление профиля пользователя
  const updateProfile = useCallback(
    async (data: ProfileUpdateData): Promise<User> => {
      // Получаем токен текущей сессии
      const currentToken = sessionStorage.getItem(TOKEN_KEY);

      if (!currentToken) {
        throw new Error("Необходимо войти в аккаунт");
      }

      // Отправляем изменённые данные на backend
      const updatedUser = await authApi.updateMe(currentToken, data);

      // Обновляем пользователя без перезагрузки страницы
      setUser(updatedUser);
      setToken(currentToken);

      // Возвращаем обновлённые данные
      return updatedUser;
    },
    [],
  );

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
          // Сервер может быть временно недоступен,
          // поэтому сохранённый токен не удаляем
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
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
