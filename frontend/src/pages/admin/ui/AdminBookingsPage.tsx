import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { KpiCard } from "../../../shared/ui/KpiCard/KpiCard";
import {
  adminApi,
  type AdminBooking,
  type AdminService,
  type AdminSession,
  type AdminUser,
} from "../../../shared/api/admin";

const tableColumns = ["Клиент", "Сервис", "Дата и время", "Статус", "Действия"];

// «ДД.ММ · ЧЧ:ММ»
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

// Подписи статусов из базы: reserved / cancelled / attended / no_show
const statusLabel = (status: string) => {
  switch (status) {
    case "reserved":
      return "Активно";
    case "cancelled":
      return "Отменено";
    case "attended":
      return "Посещено";
    case "no_show":
      return "Не явился";
    default:
      return status;
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case "reserved":
      return "#148C75";
    case "cancelled":
      return "#B04A4A";
    default:
      return "#6B819E";
  }
};

// Экран «Все бронирования»
export const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Диалог подтверждения отмены
  const [cancelTarget, setCancelTarget] = useState<AdminBooking | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [bookingsData, usersData, servicesData, sessionsData] =
          await Promise.all([
            adminApi.getBookings(),
            adminApi.getUsers(),
            adminApi.getServices(),
            adminApi.getSessions(),
          ]);

        if (cancelled) {
          return;
        }

        setBookings(bookingsData);
        setUsers(usersData);
        setServices(servicesData);
        setSessions(sessionsData);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить бронирования"
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

  // Справочники для отображения имён и времени
  const lookups = useMemo(() => {
    const userNames = new Map(users.map((user) => [user.id, user.full_name]));
    const serviceNames = new Map(
      services.map((service) => [service.id, service.name])
    );
    const sessionTimes = new Map(
      sessions.map((session) => [session.id, session.starts_at])
    );

    return { userNames, serviceNames, sessionTimes };
  }, [users, services, sessions]);

  // KPI по статусам
  const reservedCount = bookings.filter(
    (booking) => booking.status === "reserved"
  ).length;
  const cancelledCount = bookings.filter(
    (booking) => booking.status === "cancelled"
  ).length;
  const attendedCount = bookings.filter(
    (booking) => booking.status === "attended"
  ).length;

  // Отменяем бронирование
  const handleCancel = async () => {
    if (!cancelTarget) {
      return;
    }

    setIsCancelling(true);
    setCancelError("");

    try {
      const updated = await adminApi.cancelBooking(cancelTarget.id);

      setBookings((prev) =>
        prev.map((booking) => (booking.id === updated.id ? updated : booking))
      );
      setCancelTarget(null);
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "Не удалось отменить бронирование"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // CSV-экспорт текущего списка
  const handleExport = () => {
    const header = ["ID", "Клиент", "Сервис", "Дата и время", "Статус", "Цена", "Валюта"];

    const rows = bookings.map((booking) => [
      String(booking.id),
      lookups.userNames.get(booking.client_id) ?? `#${booking.client_id}`,
      lookups.serviceNames.get(booking.service_id) ?? `#${booking.service_id}`,
      formatDateTime(
        lookups.sessionTimes.get(booking.session_id) ?? booking.booked_at
      ),
      statusLabel(booking.status),
      String(booking.price_at_booking),
      booking.currency_at_booking,
    ]);

    const csv =
      "﻿" +
      [header, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${cell.replace(/"/g, '""')}"`)
            .join(";")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "bluepulse-bookings.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

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
            Все бронирования
          </Typography>

          <Typography
            sx={{ color: "#6B819E", fontSize: 16, mt: "16px", maxWidth: 1060 }}
          >
            Поиск записей, изменение статусов и контроль свободных мест.
          </Typography>
        </Box>

        {/* Экспорт списка */}
        <Button
          onClick={handleExport}
          disabled={bookings.length === 0}
          sx={{
            bgcolor: "#EAF3FF",
            color: "#176BFF",
            borderRadius: "11px",
            minHeight: 44,
            px: "15px",
            fontWeight: 600,
            fontSize: 15,
            textTransform: "none",
            "&:hover": { bgcolor: "#DCE7F3" },
          }}
        >
          Экспорт списка
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
          mt: { xs: 4, lg: "26px" },
        }}
      >
        <KpiCard label="Всего бронирований" value={String(bookings.length)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Активных" value={String(reservedCount)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Отменено" value={String(cancelledCount)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Посещено" value={String(attendedCount)} accent sx={{ minHeight: 112 }} />
      </Box>

      {/* Таблица */}
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
                lg: "minmax(0, 280fr) minmax(0, 220fr) minmax(0, 220fr) minmax(0, 180fr) minmax(0, 150fr)",
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

          {bookings.length === 0 ? (
            <Box sx={{ px: "14px", py: "48px", textAlign: "center" }}>
              <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                Бронирований пока нет.
              </Typography>
            </Box>
          ) : (
            bookings.map((booking, index) => (
              <Box
                key={booking.id}
                sx={{
                  px: "14px",
                  display: "grid",
                  alignItems: "center",
                  gridTemplateColumns: {
                    xs: "minmax(0, 2fr) minmax(0, 1fr)",
                    lg: "minmax(0, 280fr) minmax(0, 220fr) minmax(0, 220fr) minmax(0, 180fr) minmax(0, 150fr)",
                  },
                  gap: 1,
                  minHeight: 57,
                  py: "12px",
                  borderBottom:
                    index < bookings.length - 1 ? "1px solid #DCE7F3" : "none",
                }}
              >
                <Typography
                  sx={{
                    color: booking.status === "cancelled" ? "#6B819E" : "#102B52",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {lookups.userNames.get(booking.client_id) ??
                    `Клиент #${booking.client_id}`}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {lookups.serviceNames.get(booking.service_id) ??
                    `Услуга #${booking.service_id}`}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {formatDateTime(
                    lookups.sessionTimes.get(booking.session_id) ??
                      booking.booked_at
                  )}
                </Typography>
                <Typography
                  sx={{ color: statusColor(booking.status), fontSize: 15 }}
                >
                  {statusLabel(booking.status)}
                </Typography>
                <Box>
                  {booking.status === "reserved" ? (
                    <Button
                      onClick={() => {
                        setCancelError("");
                        setCancelTarget(booking);
                      }}
                      sx={{
                        color: "#B04A4A",
                        fontSize: 15,
                        fontWeight: 600,
                        textTransform: "none",
                        px: 0,
                        minWidth: 0,
                      }}
                    >
                      Отменить
                    </Button>
                  ) : (
                    <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                      —
                    </Typography>
                  )}
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
          Управление статусами
        </Typography>

        <Typography
          sx={{ color: "#6B819E", fontSize: 15, mt: "21px", maxWidth: 1020 }}
        >
          Активная запись занимает место в сеансе. Отмена освобождает место, а
          цена на момент записи сохраняется в истории бронирования.
        </Typography>
      </Box>

      {/* Диалог подтверждения отмены */}
      <Dialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        slotProps={{ paper: { sx: { borderRadius: "16px", px: 1 } } }}
      >
        <DialogTitle sx={{ color: "#102B52", fontWeight: 700, fontSize: 20 }}>
          Отмена бронирования
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#6B819E", fontSize: 14 }}>
            Клиент «
            {cancelTarget
              ? lookups.userNames.get(cancelTarget.client_id) ??
                `#${cancelTarget.client_id}`
              : ""}
            », услуга «
            {cancelTarget
              ? lookups.serviceNames.get(cancelTarget.service_id) ??
                `#${cancelTarget.service_id}`
              : ""}
            ». Место в сеансе освободится.
          </Typography>

          {cancelError && (
            <Typography role="alert" sx={{ mt: "16px", fontSize: 13, color: "error.main" }}>
              {cancelError}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 2, mt: "28px", mb: 2 }}>
            <Button
              onClick={() => setCancelTarget(null)}
              sx={{
                bgcolor: "#EAF3FF",
                color: "#176BFF",
                borderRadius: "11px",
                minHeight: 44,
                fontWeight: 600,
                textTransform: "none",
                flex: 1,
                "&:hover": { bgcolor: "#DCE7F3" },
              }}
            >
              Оставить
            </Button>

            <Button
              onClick={() => void handleCancel()}
              disabled={isCancelling}
              sx={{
                bgcolor: "#B04A4A",
                color: "#FFFFFF",
                borderRadius: "11px",
                minHeight: 44,
                fontWeight: 600,
                textTransform: "none",
                flex: 1,
                boxShadow: "none",
                "&:hover": { bgcolor: "#9A3E3E", boxShadow: "none" },
              }}
            >
              {isCancelling ? "Отменяем..." : "Отменить запись"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};
