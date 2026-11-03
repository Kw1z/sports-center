
import { useContext, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";

import { AppTextField } from "../../../shared/ui/AppTextField";
import { AppButton } from "../../../shared/ui/AppButton";
import { authApi } from "../../../shared/api/auth";
import { AuthContext } from "../model/AuthProvider";

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);

  const successMessage = (
    location.state as { message?: string } | null
  )?.message;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!auth) {
    throw new Error("AuthProvider не подключён");
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // Проверяем JWT через /api/auth/me.
      // AuthProvider сам сохранит токен и данные пользователя.
      await auth.signIn(result.access_token);

      // После успешного входа переходим на главную.
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось войти в аккаунт"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      height: 53,
      bgcolor: "#FFFFFF",
      borderRadius: "9px",
      "& fieldset": {
        borderColor: "transparent",
      },
      "&:hover fieldset": {
        borderColor: "#DCE7F3",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#176BFF",
      },
    },
    "& .MuiInputBase-input": {
      fontSize: 14,
    },
  };

  const fieldLabelStyles = {
    fontSize: 14,
    fontWeight: 600,
    color: "#0A2456",
    mb: 1.5,
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: 28, md: 38 },
          fontWeight: 800,
          color: "#0A2456",
          lineHeight: 1.2,
        }}
      >
        Войти в аккаунт
      </Typography>

      <Typography
        sx={{
          mt: 1,
          mb: 5,
          fontSize: 16,
          color: "#6B819E",
        }}
      >
        Введите данные для входа в BluePulse
      </Typography>

      {successMessage && (
        <Typography
          role="status"
          sx={{
            mb: 3,
            fontSize: 14,
            color: "success.main",
          }}
        >
          {successMessage}
        </Typography>
      )}

      <Stack spacing={3}>
        <Box>
          <Typography sx={fieldLabelStyles}>
            Электронная почта
          </Typography>

          <AppTextField
            placeholder="example@mail.ru"
            name="email"
            type="email"
            value={formData.email}
            onChange={(event) =>
              handleChange("email", event.target.value)
            }
            sx={fieldStyles}
            required
            disabled={isLoading}
          />
        </Box>

        <Box>
          <Typography sx={fieldLabelStyles}>
            Пароль
          </Typography>

          <AppTextField
            placeholder="Введите пароль"
            name="password"
            type="password"
            value={formData.password}
            onChange={(event) =>
              handleChange("password", event.target.value)
            }
            sx={fieldStyles}
            required
            disabled={isLoading}
          />
        </Box>
      </Stack>

      {error && (
        <Typography
          role="alert"
          sx={{
            mt: 2,
            fontSize: 13,
            color: "error.main",
          }}
        >
          {error}
        </Typography>
      )}

      <AppButton
        type="submit"
        fullWidth
        disabled={isLoading}
        sx={{
          mt: 4,
          height: 55,
          fontSize: 15,
          fontWeight: 600,
          borderRadius: "9px",
        }}
      >
        {isLoading ? "Выполняется вход..." : "Войти →"}
      </AppButton>

      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            color: "#6B819E",
          }}
        >
          Нет аккаунта?
        </Typography>

        <Link
          to="/register"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#176BFF",
            textDecoration: "none",
          }}
        >
          Зарегистрироваться
        </Link>
      </Box>
    </Box>
  );
};
