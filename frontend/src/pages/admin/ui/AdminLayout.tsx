import { Box, Container, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

import { AdminSidebar } from "../../../widgets/admin-sidebar/ui/AdminSidebar";

// Оболочка админ-панели: шапка + бургер-меню + контент страницы
export const AdminLayout = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F8FE",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Шапка админки */}
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
            px: { xs: 2, sm: 3, lg: "36px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Бургер-меню + выезжающая панель (осознанная адаптация макета) */}
            <AdminSidebar />

            {/* Логотип */}
            <Box sx={{ display: "flex", alignItems: "baseline" }}>
              <Typography
                sx={{
                  color: "#176BFF",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
              >
                Blue
              </Typography>

              <Typography
                sx={{
                  color: "#102B52",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
              >
                Pulse
              </Typography>
            </Box>
          </Box>

          {/* Подпись роли */}
          <Typography sx={{ color: "#102B52", fontSize: 16, fontWeight: 600 }}>
            Администратор
          </Typography>
        </Container>
      </Box>

      {/* Контент страницы */}
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};
