
import { useContext } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { AuthContext } from "../../../features/authorization/model/AuthProvider";

const navItems = [
  { label: "Главная", path: "/" },
  { label: "Каталог", path: "/catalog" },
  { label: "Расписание", path: "/schedule" },
  { label: "Тренеры", path: "/trainers" },
  { label: "Мои записи", path: "/bookings" },
];

export const Header = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    auth?.signOut();
    navigate("/");
  };

  return (
    <Box
      component="header"
      sx={{
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #DCE7F3",
        width: "100%",
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: "1440px",
          minHeight: 83,
          px: { xs: 2, sm: 3, lg: "48px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 3,
          flexWrap: { xs: "wrap", lg: "nowrap" },
          py: { xs: 2, lg: 0 },
        }}
      >
        {/* Логотип */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              color: "#176BFF",
              fontSize: 27,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            Blue
          </Typography>

          <Typography
            sx={{
              color: "#0A2456",
              fontSize: 27,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            Pulse
          </Typography>
        </Box>

        {/* Навигация */}
        <Box
          component="nav"
          aria-label="Основная навигация"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 2, md: 4 },
            flexWrap: "wrap",
          }}
        >
          {navItems.map((item) => (
            <Box
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.path === "/"}
              sx={{
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
                color: "#0A2456",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "primary.main",
                },
                "&.active": {
                  color: "primary.main",
                  fontWeight: 800,
                },
              }}
            >
              {item.label}
            </Box>
          ))}
        </Box>

        {/* Авторизация */}
        {auth?.isLoading ? (
          <Box sx={{ minWidth: 120, height: 42 }} />
        ) : auth?.isAuthenticated ? (
          <Button
            variant="contained"
            onClick={handleLogout}
            sx={{
              bgcolor: "#176BFF",
              color: "#FFFFFF",
              borderRadius: "11px",
              px: 3,
              minWidth: 120,
              minHeight: 42,
              fontWeight: 600,
              textTransform: "none",
              flexShrink: 0,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#0F57D9",
                boxShadow: "none",
              },
            }}
          >
            Выйти
          </Button>
        ) : (
          <Button
            component={Link}
            to="/login"
            variant="contained"
            sx={{
              bgcolor: "#176BFF",
              color: "#FFFFFF",
              borderRadius: "11px",
              px: 3,
              minWidth: 120,
              minHeight: 42,
              fontWeight: 600,
              textTransform: "none",
              flexShrink: 0,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#0F57D9",
                boxShadow: "none",
              },
            }}
          >
            Войти
          </Button>
        )}
      </Container>
    </Box>
  );
};
