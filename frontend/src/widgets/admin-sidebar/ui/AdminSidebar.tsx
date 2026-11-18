
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

type AdminMenuItem = {
  label: string;
  path: string;
};

const menuItems: AdminMenuItem[] = [
  { label: "Обзор", path: "/admin" },
  { label: "Сеансы и записи", path: "/admin/sessions" },
  { label: "Услуги и цены", path: "/admin/services" },
  { label: "Сотрудники", path: "/admin/staff" },
  { label: "Залы и кабинеты", path: "/admin/rooms" },
  { label: "Все бронирования", path: "/admin/bookings" },
  { label: "Пользователи", path: "/admin/users" },
];

export const AdminSidebar = () => {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Кнопка открытия бургер-меню */}
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Открыть меню администратора"
        sx={{
          color: "#176BFF",
          width: 42,
          height: 42,
          borderRadius: "10px",
          "&:hover": {
            bgcolor: "#E8F1FE",
          },
        }}
      >
        <MenuIcon sx={{ fontSize: 26 }} />
      </IconButton>

      {/* Выдвижная панель */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 280, sm: 300 },
              bgcolor: "#0A2456",
              color: "#FFFFFF",
              border: "none",
              boxShadow: "8px 0 30px rgba(10,36,86,0.15)",
            },
          },
        }}
      >
        {/* Верхняя часть панели */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Blue Pulse
            </Typography>

            <Typography
              sx={{
                color: "#AFC7E8",
                fontSize: 11,
                mt: 0.3,
              }}
            >
              Панель администратора
            </Typography>
          </Box>

          <IconButton
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
            sx={{
              color: "#FFFFFF",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.12)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider
          sx={{
            borderColor: "rgba(255,255,255,0.12)",
          }}
        />

        {/* Раздел управления */}
        <Typography
          sx={{
            px: 3,
            pt: 3,
            pb: 1.5,
            color: "#91ADD1",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          BLUEPULSE / УПРАВЛЕНИЕ
        </Typography>

        {/* Пункты меню */}
        <List
          disablePadding
          sx={{
            px: 2,
          }}
        >
          {menuItems.map((item) => {
            const active =
              item.path === "/admin"
                ? location.pathname === "/admin" ||
                  location.pathname === "/admin/"
                : location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);

            return (
              <ListItemButton
                key={item.path}
                selected={active}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  mb: 0.6,
                  px: 2,
                  py: 1.25,
                  borderRadius: "10px",
                  color: active ? "#FFFFFF" : "#C0D3EC",
                  bgcolor: active ? "#176BFF" : "transparent",
                  transition: "background-color 0.2s ease",
                  "&.Mui-selected": {
                    bgcolor: "#176BFF",
                    color: "#FFFFFF",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "#0F57D9",
                  },
                  "&:hover": {
                    bgcolor: active
                      ? "#0F57D9"
                      : "rgba(255,255,255,0.10)",
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                      },
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* Низ панели */}
        <Box
          sx={{
            p: 3,
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Typography
            sx={{
              color: "#91ADD1",
              fontSize: 12,
            }}
          >
            BluePulse · Администрирование
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};
