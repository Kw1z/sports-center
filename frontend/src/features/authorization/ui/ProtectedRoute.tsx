
import { useContext, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import { AuthContext } from "../model/AuthProvider";

type ProtectedRouteProps = {
  children: ReactNode;
  /** Требуемая роль пользователя, например "admin" */
  role?: string;
};

export const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (!auth) {
    throw new Error("AuthProvider не подключён");
  }

  // Пока проверяем сохранённый токен, не перенаправляем пользователя.
  if (auth.isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Если пользователь не авторизован, отправляем его на страницу входа.
  if (!auth.isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Если роль не совпадает с требуемой, отправляем на главную.
  if (role && auth.user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
