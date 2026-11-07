import { useContext } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Typography } from "@mui/material";

import { AuthContext } from "../../../features/authorization/model/AuthProvider";

export const Header = () => {
  const auth = useContext(AuthContext);

  return (
    <Box
      component="header"
      sx={{
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #DCE7F3",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: 76,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          {/* Логотип BluePulse */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/images/BluePulse.png"
              alt="BluePulse"
              sx={{
                width: "auto",
                height: 48,
                maxWidth: 180,
                objectFit: "contain",
              }}
            />
          </Box>

          {/* Навигация */}
          <Box
            component="nav"
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 3,
            }}
          >
            {["Каталог", "Расписание", "Тренера", "Мои записи"].map((item) => (
              <Typography
                key={item}
                sx={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "text.primary",
                  whiteSpace: "nowrap",
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>

          {/* Авторизация */}
          {!auth?.isLoading &&
            (auth?.isAuthenticated ? (
              <Button
                variant="outlined"
                onClick={() => auth.signOut()}
                sx={{
                  px: 3,
                  whiteSpace: "nowrap",
                }}
              >
                Выйти
              </Button>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                sx={{
                  px: 3,
                  whiteSpace: "nowrap",
                }}
              >
                Войти
              </Button>
            ))}
        </Box>
      </Container>
    </Box>
  );
};
