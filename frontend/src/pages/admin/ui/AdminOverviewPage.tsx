import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { KpiCard } from "../../../shared/ui/KpiCard/KpiCard";
import { StatusChip } from "../../../shared/ui/StatusChip/StatusChip";

// Демо-данные из макета Figma (не реальные показатели backend)
const kpiItems = [
  { label: "Занятий сегодня", value: "18", footnote: "+3 к вчера" },
  { label: "Бронирований", value: "126", footnote: "За сегодня" },
  { label: "Свободных мест", value: "42", footnote: "На сегодня" },
  { label: "Активных услуг", value: "9", footnote: "В каталоге" },
];

const upcomingSessions = [
  { service: "Йога и баланс", time: "09:00", seats: "7/15", status: "Открыт" },
  { service: "Пилатес", time: "12:30", seats: "10/12", status: "Открыт" },
  { service: "Массаж", time: "14:00", seats: "1/1", status: "Занят" },
  { service: "Сайкл", time: "18:30", seats: "6/12", status: "Открыт" },
] as const;

const quickActions = [
  { label: "Услуги и цены", path: "/admin/services" },
  { label: "Сеансы", path: "/admin/sessions" },
  { label: "Сотрудники", path: "/admin/staff" },
  { label: "Все записи", path: "/admin/bookings" },
];

// Экран «Обзор» — панель администратора
export const AdminOverviewPage = () => {
  const navigate = useNavigate();

  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: "1440px",
        px: { xs: 2, sm: 3, lg: "39px" },
        pt: { xs: 3, lg: "46px" },
        pb: 6,
      }}
    >
      {/* Надзаголовок */}
      <Typography
        sx={{
          color: "#176BFF",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        ОБЗОР
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 3,
          flexWrap: "wrap",
          mt: "12px",
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              color: "#0A2456",
              fontSize: { xs: 30, lg: 36 },
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            Панель администратора
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 17,
              mt: "9px",
            }}
          >
            Управляйте клубом, занятиями и загрузкой залов
          </Typography>
        </Box>

        {/* Кнопка создания сеанса */}
        <Button
          variant="contained"
          onClick={() => navigate("/admin/sessions/new")}
          sx={{
            bgcolor: "#176BFF",
            color: "#FFFFFF",
            borderRadius: "12px",
            minHeight: 49,
            px: "19px",
            fontWeight: 600,
            fontSize: 15,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#0F57D9",
              boxShadow: "none",
            },
          }}
        >
          + Создать сеанс
        </Button>
      </Box>

      {/* KPI-карточки */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: { xs: 2, lg: "29px" },
          mt: { xs: 4, lg: "46px" },
        }}
      >
        {kpiItems.map((item) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={item.value}
            footnote={item.footnote}
            sx={{ minHeight: 143 }}
          />
        ))}
      </Box>

      {/* Нижний ряд: ближайшие сеансы + быстрые действия */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 743fr) minmax(0, 327fr)" },
          gap: { xs: 3, lg: "25px" },
          mt: { xs: 4, lg: "31px" },
        }}
      >
        {/* Ближайшие сеансы */}
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "17px",
            px: "25px",
            py: "30px",
          }}
        >
          <Typography
            component="h2"
            sx={{
              color: "#0A2456",
              fontSize: 25,
              fontWeight: 700,
            }}
          >
            Ближайшие сеансы
          </Typography>

          {/* Заголовок таблицы */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 2fr) minmax(0, 1fr)",
                lg: "minmax(0, 230fr) minmax(0, 117fr) minmax(0, 189fr) 119px",
              },
              gap: 1,
              mt: "24px",
              pb: "10px",
              borderBottom: "1px solid #DCE7F3",
            }}
          >
            <Typography sx={{ color: "#6B819E", fontSize: 14, fontWeight: 600 }}>
              Услуга
            </Typography>
            <Typography sx={{ color: "#6B819E", fontSize: 14, fontWeight: 600 }}>
              Время
            </Typography>
            <Typography sx={{ color: "#6B819E", fontSize: 14, fontWeight: 600 }}>
              Места
            </Typography>
            <Typography sx={{ color: "#6B819E", fontSize: 14, fontWeight: 600 }}>
              Статус
            </Typography>
          </Box>

          {/* Строки */}
          {upcomingSessions.map((session, index) => (
            <Box
              key={`${session.service}-${session.time}`}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 2fr) minmax(0, 1fr)",
                  lg: "minmax(0, 230fr) minmax(0, 117fr) minmax(0, 189fr) 119px",
                },
                gap: 1,
                alignItems: "center",
                py: "12px",
                borderBottom:
                  index < upcomingSessions.length - 1
                    ? "1px solid #DCE7F3"
                    : "none",
              }}
            >
              <Typography sx={{ color: "#102B52", fontSize: 15, fontWeight: 600 }}>
                {session.service}
              </Typography>
              <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                {session.time}
              </Typography>
              <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                {session.seats}
              </Typography>
              <Box>
                <StatusChip
                  label={session.status}
                  variant={session.status === "Открыт" ? "open" : "busy"}
                />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Быстрые действия */}
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "17px",
            px: "21px",
            py: "29px",
            alignSelf: "start",
          }}
        >
          <Typography
            component="h2"
            sx={{
              color: "#0A2456",
              fontSize: 23,
              fontWeight: 700,
            }}
          >
            Быстрые действия
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              mt: "30px",
            }}
          >
            {quickActions.map((action) => (
              <Button
                key={action.path}
                fullWidth
                onClick={() => navigate(action.path)}
                sx={{
                  bgcolor: "#EAF3FF",
                  color: "#176BFF",
                  borderRadius: "11px",
                  minHeight: 48,
                  fontWeight: 600,
                  fontSize: 16,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "#DCE7F3",
                  },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};
