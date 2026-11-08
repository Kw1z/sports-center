import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography,
} from "@mui/material";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";

import { Header } from "../../../widgets/header/ui/Header";

import { AuthContext } from "../../../features/authorization/model/AuthProvider";

import { bookingsApi, type Booking } from "../../../shared/api/bookings";

import {
  sessionsApi,
  type TrainingSession,
} from "../../../shared/api/sessions";

// Форматирование даты
const formatDate = (value: string): string => {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Форматирование времени
const formatTime = (value: string): string => {
  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Форматирование стоимости
const formatPrice = (price: string, currency: string): string => {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return `${price} ${currency}`;
  }

  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

type Notification = {
  message: string;
  severity: "success" | "error";
};

export const BookingsPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Запись, которую пользователь хочет отменить
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  // Состояние отправки отмены
  const [cancelling, setCancelling] = useState(false);

  // Уведомления
  const [notification, setNotification] = useState<Notification | null>(null);

  const token = auth?.token;
  const authLoading = auth?.isLoading ?? true;

  // Загружаем бронирования текущего пользователя
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!token) {
      setBookings([]);
      setSessions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError("");
      setBookings([]);
      setSessions([]);

      try {
        // Получаем реальные бронирования
        const bookingsData = await bookingsApi.getMyBookings(token);

        if (cancelled) return;

        setBookings(bookingsData);

        // Получаем подробности тренировок
        try {
          const sessionsData = await sessionsApi.getAll();

          if (!cancelled) {
            setSessions(sessionsData);
          }
        } catch (sessionError) {
          console.error(
            "Не удалось загрузить подробности занятий:",
            sessionError,
          );
        }
      } catch (err) {
        console.error("Ошибка загрузки бронирований:", err);

        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Не удалось загрузить записи",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [token, authLoading]);

  // Сопоставляем записи с тренировками
  const sessionMap = useMemo(() => {
    return new Map(sessions.map((session) => [session.id, session]));
  }, [sessions]);

  // Статистика
  const totalBookings = bookings.length;

  const activeBookings = bookings.filter(
    (booking) => booking.status === "reserved",
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "cancelled",
  ).length;

  // Отправляем отмену на backend
  const handleCancelBooking = async () => {
    if (!bookingToCancel || !token || cancelling) {
      return;
    }

    setCancelling(true);

    try {
      // PATCH /api/bookings/{id}/cancel
      const updatedBooking = await bookingsApi.cancelBooking(
        bookingToCancel.id,
        token,
      );

      // Обновляем запись без перезагрузки страницы
      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === updatedBooking.id ? updatedBooking : booking,
        ),
      );

      // Закрываем окно
      setBookingToCancel(null);

      // Показываем уведомление
      setNotification({
        message: "Бронирование успешно отменено!",
        severity: "success",
      });
    } catch (err) {
      setNotification({
        message:
          err instanceof Error ? err.message : "Не удалось отменить запись",
        severity: "error",
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F8FE",
      }}
    >
      {/* Шапка */}
      <Header />

      <Box component="main">
        <Container
          maxWidth={false}
          sx={{
            maxWidth: "1440px",
            px: { xs: 2, sm: 3, lg: "48px" },
            pt: { xs: 4, lg: 5 },
            pb: 8,
          }}
        >
          {/* Заголовок */}
          <Box
            sx={{
              display: "flex",
              alignItems: {
                xs: "flex-start",
                md: "center",
              },
              justifyContent: "space-between",
              flexDirection: {
                xs: "column",
                md: "row",
              },
              gap: 3,
              mb: 5,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#176BFF",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  mb: 2,
                }}
              >
                BLUEPULSE · ЛИЧНЫЙ КАБИНЕТ
              </Typography>

              <Typography
                component="h1"
                sx={{
                  color: "#0A2456",
                  fontSize: { xs: 32, md: 44 },
                  fontWeight: 800,
                  mb: 2,
                }}
              >
                Мои записи
              </Typography>

              <Typography
                sx={{
                  color: "#6B819E",
                  fontSize: { xs: 15, md: 18 },
                  fontWeight: 600,
                }}
              >
                Все твои тренировки и бронирования в одном месте.
              </Typography>
            </Box>

            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/schedule")}
              sx={{
                bgcolor: "#176BFF",
                borderRadius: "12px",
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#0F57D9",
                  boxShadow: "none",
                },
              }}
            >
              Найти занятие
            </Button>
          </Box>

          {/* Неавторизованный пользователь */}
          {!authLoading && !token && (
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid #DCE7F3",
                borderRadius: "24px",
                textAlign: "center",
                py: 8,
                px: 3,
              }}
            >
              <EventNoteOutlinedIcon
                sx={{
                  fontSize: 64,
                  color: "#176BFF",
                  mb: 2,
                }}
              />

              <Typography
                sx={{
                  fontSize: 26,
                  color: "#0A2456",
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Войди в свой аккаунт
              </Typography>

              <Typography
                sx={{
                  color: "#6B819E",
                  mb: 3,
                }}
              >
                Чтобы просматривать свои записи, необходимо авторизоваться.
              </Typography>

              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  bgcolor: "#176BFF",
                  borderRadius: "12px",
                  textTransform: "none",
                  px: 4,
                  py: 1.5,
                }}
              >
                Войти
              </Button>
            </Box>
          )}

          {/* Загрузка */}
          {(loading || authLoading) && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {/* Основное содержимое */}
          {!loading && !authLoading && token && (
            <>
              {/* Ошибка */}
              {error ? (
                <Alert severity="error" sx={{ mb: 4 }}>
                  {error}
                </Alert>
              ) : (
                <>
                  {/* Статистика */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(3, minmax(0, 1fr))",
                      },
                      gap: 3,
                      mb: 5,
                    }}
                  >
                    {[
                      {
                        label: "Всего записей",
                        value: totalBookings,
                      },
                      {
                        label: "Активных",
                        value: activeBookings,
                      },
                      {
                        label: "Отменено",
                        value: cancelledBookings,
                      },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          bgcolor: "#FFFFFF",
                          border: "1px solid #DCE7F3",
                          borderRadius: "20px",
                          p: 3,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 36,
                            fontWeight: 800,
                            color: "#176BFF",
                            mb: 1,
                          }}
                        >
                          {item.value}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 15,
                            color: "#6B819E",
                            fontWeight: 600,
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Нет бронирований */}
                  {bookings.length === 0 && (
                    <Box
                      sx={{
                        bgcolor: "#FFFFFF",
                        border: "1px solid #DCE7F3",
                        borderRadius: "24px",
                        textAlign: "center",
                        py: 8,
                        px: 3,
                      }}
                    >
                      <EventBusyOutlinedIcon
                        sx={{
                          fontSize: 64,
                          color: "#A8BCD3",
                          mb: 2,
                        }}
                      />

                      <Typography
                        sx={{
                          color: "#0A2456",
                          fontSize: 24,
                          fontWeight: 700,
                          mb: 1,
                        }}
                      >
                        Пока нет записей
                      </Typography>

                      <Typography
                        sx={{
                          color: "#6B819E",
                          mb: 3,
                        }}
                      >
                        Выбери подходящую тренировку и запишись на неё.
                      </Typography>

                      <Button
                        variant="contained"
                        onClick={() => navigate("/schedule")}
                        sx={{
                          bgcolor: "#176BFF",
                          borderRadius: "12px",
                          textTransform: "none",
                          px: 3,
                          py: 1.5,
                        }}
                      >
                        Перейти к расписанию
                      </Button>
                    </Box>
                  )}

                  {/* Карточки бронирований */}
                  {bookings.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                      }}
                    >
                      {bookings.map((booking) => {
                        const session = sessionMap.get(booking.session_id);

                        const isActive = booking.status === "reserved";

                        // Кнопка отмены доступна только
                        // для будущих занятий.
                        const canCancel =
                          isActive &&
                          (!session ||
                            new Date(session.starts_at).getTime() > Date.now());

                        return (
                          <Box
                            key={booking.id}
                            sx={{
                              bgcolor: "#FFFFFF",
                              border: "1px solid #DCE7F3",
                              borderRadius: "20px",
                              p: { xs: 3, md: 4 },
                              transition: "box-shadow 0.2s ease",
                              "&:hover": {
                                boxShadow: "0 8px 25px rgba(10,36,86,0.06)",
                              },
                            }}
                          >
                            {/* Название и статус */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 2,
                                mb: 3,
                              }}
                            >
                              <Typography
                                component="h2"
                                sx={{
                                  fontSize: {
                                    xs: 21,
                                    md: 24,
                                  },
                                  fontWeight: 700,
                                  color: "#0A2456",
                                }}
                              >
                                {session?.service_name ??
                                  `Занятие №${booking.session_id}`}
                              </Typography>

                              <Chip
                                label={
                                  isActive
                                    ? "Активная запись"
                                    : booking.status === "cancelled"
                                      ? "Отменено"
                                      : booking.status
                                }
                                color={isActive ? "success" : "default"}
                                variant="outlined"
                                sx={{
                                  fontWeight: 600,
                                }}
                              />
                            </Box>

                            {/* Информация о тренировке */}
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr",
                                  sm: "repeat(2, 1fr)",
                                },
                                gap: 2,
                                mb: 3,
                              }}
                            >
                              {/* Дата */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <CalendarMonthOutlinedIcon
                                  sx={{ color: "#176BFF" }}
                                />

                                <Typography sx={{ color: "#6B819E" }}>
                                  {session
                                    ? formatDate(session.starts_at)
                                    : "Дата занятия недоступна"}
                                </Typography>
                              </Box>

                              {/* Время */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <AccessTimeOutlinedIcon
                                  sx={{ color: "#176BFF" }}
                                />

                                <Typography sx={{ color: "#6B819E" }}>
                                  {session
                                    ? `${formatTime(session.starts_at)}–${formatTime(session.ends_at)}`
                                    : "Время недоступно"}
                                </Typography>
                              </Box>

                              {/* Зал */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <LocationOnOutlinedIcon
                                  sx={{ color: "#176BFF" }}
                                />

                                <Typography sx={{ color: "#6B819E" }}>
                                  {session?.room_name ??
                                    "Информация о зале недоступна"}
                                </Typography>
                              </Box>

                              {/* Тренер */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <PersonOutlineOutlinedIcon
                                  sx={{ color: "#176BFF" }}
                                />

                                <Typography sx={{ color: "#6B819E" }}>
                                  {session?.staff_name ?? "Тренер не указан"}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Стоимость и отмена */}
                            <Box
                              sx={{
                                borderTop: "1px solid #DCE7F3",
                                pt: 3,
                                display: "flex",
                                alignItems: {
                                  xs: "flex-start",
                                  sm: "center",
                                },
                                justifyContent: "space-between",
                                flexDirection: {
                                  xs: "column",
                                  sm: "row",
                                },
                                gap: 2,
                              }}
                            >
                              {/* Цена */}
                              <Box>
                                <Typography
                                  sx={{
                                    fontSize: 13,
                                    color: "#6B819E",
                                    mb: 0.5,
                                  }}
                                >
                                  Стоимость записи
                                </Typography>

                                <Typography
                                  sx={{
                                    fontSize: 23,
                                    fontWeight: 800,
                                    color: "#176BFF",
                                  }}
                                >
                                  {formatPrice(
                                    booking.price_at_booking,
                                    booking.currency_at_booking,
                                  )}
                                </Typography>
                              </Box>

                              {/* Дата бронирования и кнопка */}
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: {
                                    xs: "flex-start",
                                    sm: "flex-end",
                                  },
                                  gap: 1.5,
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: "#6B819E",
                                    fontSize: 13,
                                  }}
                                >
                                  Записано: {formatDate(booking.booked_at)}
                                </Typography>

                                {canCancel && (
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => setBookingToCancel(booking)}
                                    sx={{
                                      borderRadius: "11px",
                                      textTransform: "none",
                                      fontWeight: 600,
                                      px: 2.5,
                                      py: 1.1,
                                    }}
                                  >
                                    Отменить запись
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </Container>
      </Box>

      {/* Окно подтверждения отмены */}
      <Dialog
        open={bookingToCancel !== null}
        onClose={() => {
          if (!cancelling) {
            setBookingToCancel(null);
          }
        }}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              p: 1,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#0A2456",
            fontSize: 23,
            fontWeight: 700,
          }}
        >
          Отменить запись?
        </DialogTitle>

        <DialogContent>
          <DialogContentText
            sx={{
              color: "#6B819E",
              lineHeight: 1.7,
            }}
          >
            Ты действительно хочешь отменить бронирование? После подтверждения
            запись получит статус «Отменено».
          </DialogContentText>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            gap: 1,
          }}
        >
          <Button
            disabled={cancelling}
            onClick={() => setBookingToCancel(null)}
            sx={{
              color: "#6B819E",
              textTransform: "none",
            }}
          >
            Назад
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={cancelling}
            onClick={() => void handleCancelBooking()}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {cancelling ? "Отменяем..." : "Отменить запись"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомление */}
      <Snackbar
        open={notification !== null}
        autoHideDuration={5000}
        onClose={() => setNotification(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity={notification?.severity ?? "success"}
          variant="filled"
          onClose={() => setNotification(null)}
          sx={{
            width: "100%",
            borderRadius: "12px",
          }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
