
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";

import { AppTextField } from "../../../shared/ui/AppTextField";
import { AppButton } from "../../../shared/ui/AppButton";
import { authApi } from "../../../shared/api/auth";

export const RegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (formData.name.trim().length < 2) {
      setError("Введите имя и фамилию");
      return;
    }

    if (formData.password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (!agreed) {
      setError("Необходимо согласиться с условиями");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate("/login", {
        state: {
          message: "Регистрация прошла успешно! Теперь войдите в аккаунт.",
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось зарегистрироваться. Попробуйте ещё раз."
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
        Создать аккаунт
      </Typography>

      <Typography
        sx={{
          mt: 1,
          mb: 5,
          fontSize: 16,
          color: "#6B819E",
        }}
      >
        Понадобится только несколько данных
      </Typography>

      <Stack spacing={3}>
        <Box>
          <Typography sx={fieldLabelStyles}>Имя и фамилия</Typography>
          <AppTextField
            placeholder="Как к вам обращаться?"
            name="name"
            value={formData.name}
            onChange={(event) =>
              handleChange("name", event.target.value)
            }
            sx={fieldStyles}
            required
            disabled={isLoading}
          />
        </Box>

        <Box>
          <Typography sx={fieldLabelStyles}>Электронная почта</Typography>
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
          <Typography sx={fieldLabelStyles}>Пароль</Typography>
          <AppTextField
            placeholder="Не менее 8 символов"
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

        <Box>
          <Typography sx={fieldLabelStyles}>Повторите пароль</Typography>
          <AppTextField
            placeholder="Введите пароль ещё раз"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(event) =>
              handleChange("confirmPassword", event.target.value)
            }
            sx={fieldStyles}
            required
            disabled={isLoading}
          />
        </Box>
      </Stack>

      <FormControlLabel
        sx={{
          mt: 3,
          ml: 0,
          "& .MuiFormControlLabel-label": {
            fontSize: 13,
            color: "#6B819E",
          },
        }}
        control={
          <Checkbox
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            disabled={isLoading}
            sx={{
              color: "#176BFF",
              "&.Mui-checked": {
                color: "#176BFF",
              },
            }}
          />
        }
        label="Согласен(на) с условиями использования"
      />

      {error && (
        <Typography
          role="alert"
          sx={{
            mt: 1,
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
          mt: 3,
          height: 55,
          fontSize: 15,
          fontWeight: 600,
          borderRadius: "9px",
        }}
      >
        {isLoading ? "Регистрация..." : "Зарегистрироваться →"}
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
          Уже есть аккаунт?
        </Typography>

        <Link
          to="/login"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#176BFF",
            textDecoration: "none",
          }}
        >
          Войти
        </Link>
      </Box>
    </Box>
  );
};
