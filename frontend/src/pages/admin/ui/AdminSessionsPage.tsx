import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import { KpiCard } from "../../../shared/ui/KpiCard/KpiCard";
import {
  adminApi,
  type AdminBooking,
  type AdminSession,
} from "../../../shared/api/admin";

const tableColumns = ["Услуга", "Дата и время", "Зал / специалист", "Места", "Действия"];

// «ДД.ММ · ЧЧ:ММ» для колонки «Дата и время»
const formatDateTime = (iso: string) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month} · ${hours}:${minutes}`;
};

// Экран «Сеансы и записи»
export const AdminSessionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Сообщение после успешного создания сеанса
  const message = (location.state as { message?: string } | null)?.message;

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [bookedBySession, setBookedBySession] = useState<Map<number, number>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Загружаем занятия и бронирования (для колонки «Места»)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [sessionsData, bookingsData] = await Promise.all([
          adminApi.getSessions(),
          adminApi.getBookings() as Promise<AdminBooking[]>,
        ]);

        if (cancelled) {
          return;
        }

        // Считаем активные бронирования каждого занятия
        const counts = new Map<number, number>();

        bookingsData.forEach((booking) => {
          if (booking.status !== "cancelled") {
            counts.set(
              booking.session_id,
              (counts.get(booking.session_id) ?? 0) + 1
            );
          }
        });

        setSessions(sessionsData);
        setBookedBySession(counts);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить сеансы"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  // KPI по текущим данным
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(
    (session) => session.starts_at.slice(0, 10) === todayIso
  );
  const freeSeats = sessions
    .filter((session) => session.status !== "cancelled")
    .reduce(
      (sum, session) =>
        sum +
        Math.max(
          0,
          session.capacity - (bookedBySession.get(session.id) ?? 0)
        ),
      0
    );

  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: "1440px",
        px: { xs: 2, sm: 3, lg: "36px" },
        pt: { xs: 3, lg: "62px" },
        pb: 6,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 3,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              color: "#102B52",
              fontSize: { xs: 30, lg: 35 },
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            Сеансы
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 16,
              mt: "16px",
              maxWidth: 1060,
            }}
          >
            Создание, перенос и отмена групповых занятий и индивидуальных
            сеансов.
          </Typography>
        </Box>

        {/* Кнопка создания сеанса */}
        <Button
          variant="contained"
          onClick={() => navigate("/admin/sessions/new")}
          sx={{
            bgcolor: "#176BFF",
            color: "#FFFFFF",
            borderRadius: "11px",
            minHeight: 44,
            px: "15px",
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

      {message && (
        <Typography
          role="status"
          sx={{
            mt: "24px",
            fontSize: 14,
            fontWeight: 600,
            color: "success.main",
          }}
        >
          {message}
        </Typography>
      )}

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
          mt: { xs: 4, lg: "26px" },
        }}
      >
        <KpiCard
          label="Сеансов сегодня"
          value={String(todaySessions.length)}
          accent
          sx={{ minHeight: 112 }}
        />
        <KpiCard
          label="Мест доступно"
          value={String(freeSeats)}
          accent
          sx={{ minHeight: 112 }}
        />
        <KpiCard
          label="Всего сеансов"
          value={String(sessions.length)}
          accent
          sx={{ minHeight: 112 }}
        />
        <KpiCard
          label="Отменённых"
          value={String(
            sessions.filter((session) => session.status === "cancelled").length
          )}
          accent
          sx={{ minHeight: 112 }}
        />
      </Box>

      {/* Содержимое таблицы */}
      {isLoading ? (
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            minHeight: 300,
            mt: { xs: 4, lg: "63px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            minHeight: 300,
            mt: { xs: 4, lg: "63px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ color: "error.main", fontSize: 16 }}>
            {error}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            p: "12px",
            mt: { xs: 4, lg: "63px" },
          }}
        >
          {/* Подложка заголовка таблицы */}
          <Box
            sx={{
              bgcolor: "#EAF3FF",
              borderRadius: "9px",
              minHeight: 46,
              px: "14px",
              display: "grid",
              alignItems: "center",
              gridTemplateColumns: {
                xs: "minmax(0, 2fr) minmax(0, 1fr)",
                lg: "minmax(0, 235fr) minmax(0, 238fr) minmax(0, 224fr) minmax(0, 190fr) minmax(0, 165fr)",
              },
              gap: 1,
            }}
          >
            {tableColumns.map((column) => (
              <Typography
                key={column}
                sx={{ color: "#6B819E", fontSize: 14, fontWeight: 600 }}
              >
                {column}
              </Typography>
            ))}
          </Box>

          {/* Строки */}
          {sessions.length === 0 ? (
            <Box sx={{ px: "14px", py: "48px", textAlign: "center" }}>
              <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                Сеансов пока нет — создайте первый.
              </Typography>
            </Box>
          ) : (
            sessions.map((session, index) => (
              <Box
                key={session.id}
                sx={{
                  px: "14px",
                  display: "grid",
                  alignItems: "center",
                  gridTemplateColumns: {
                    xs: "minmax(0, 2fr) minmax(0, 1fr)",
                    lg: "minmax(0, 235fr) minmax(0, 238fr) minmax(0, 224fr) minmax(0, 190fr) minmax(0, 165fr)",
                  },
                  gap: 1,
                  minHeight: 57,
                  py: "12px",
                  borderBottom:
                    index < sessions.length - 1
                      ? "1px solid #DCE7F3"
                      : "none",
                }}
              >
                <Typography
                  sx={{ color: "#102B52", fontSize: 15, fontWeight: 600 }}
                >
                  {session.service_name}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {formatDateTime(session.starts_at)}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {session.room_name}
                  {session.staff_name ? ` / ${session.staff_name}` : ""}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {bookedBySession.get(session.id) ?? 0} / {session.capacity}
                </Typography>
                <Box>
                  {/* TODO: переход на форму редактирования сеанса */}
                  <Button
                    sx={{
                      color: "#176BFF",
                      fontSize: 15,
                      fontWeight: 600,
                      textTransform: "none",
                      px: 0,
                      minWidth: 0,
                    }}
                  >
                    Изменить
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* Подсказка внизу */}
      <Box
        sx={{
          bgcolor: "#EAF3FF",
          borderRadius: "16px",
          px: "24px",
          py: "22px",
          mt: { xs: 3, lg: "55px" },
        }}
      >
        <Typography
          component="h2"
          sx={{ color: "#102B52", fontSize: 18, fontWeight: 700 }}
        >
          При создании сеанса
        </Typography>

        <Typography
          sx={{
            color: "#6B819E",
            fontSize: 15,
            mt: "21px",
            maxWidth: 1020,
          }}
        >
          Выбирайте услугу, дату и время, зал, сотрудника и вместимость.
          Конфликты проверяет сервер.
        </Typography>
      </Box>
    </Container>
  );
};
