import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Snackbar,
  Typography,
} from "@mui/material";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

import { Header } from "../../../widgets/header/ui/Header";
import { AuthContext } from "../../../features/authorization/model/AuthProvider";

import {
  sessionsApi,
  type TrainingSession,
} from "../../../shared/api/sessions";

import { bookingsApi } from "../../../shared/api/bookings";

// Дата в формате YYYY-MM-DD
const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Время занятия
const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Продолжительность занятия
const getDuration = (session: TrainingSession): number => {
  const start = new Date(session.starts_at).getTime();
  const end = new Date(session.ends_at).getTime();

  return Math.round((end - start) / 60000);
};

// Ближайшие семь дней
const getNextSevenDays = (): Date[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
};

type Notification = {
  message: string;
  severity: "success" | "error" | "info";
};

export const SchedulePage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  const [selectedDate, setSelectedDate] = useState(getDateKey(new Date()));

  const [selectedService, setSelectedService] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ID занятия, на которое сейчас отправляется запись
  const [bookingSessionId, setBookingSessionId] = useState<number | null>(null);

  // Занятия, на которые удалось записаться
  const [bookedSessionIds, setBookedSessionIds] = useState<number[]>([]);

  useEffect(() => {
    if (auth?.isLoading) return;

    const token = auth?.token;

    if (!token) {
      setBookedSessionIds([]);
      return;
    }

    let cancelled = false;

    const loadMyBookings = async () => {
      try {
        const bookings = await bookingsApi.getMyBookings(token);

        if (!cancelled) {
          const reservedIds = bookings
            .filter((booking) => booking.status === "reserved")
            .map((booking) => booking.session_id);

          setBookedSessionIds(reservedIds);
        }
      } catch (error) {
        console.error("Не удалось загрузить мои записи:", error);
      }
    };

    void loadMyBookings();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, auth?.isLoading]);

  // Уведомление
  const [notification, setNotification] = useState<Notification | null>(null);

  // Загружаем расписание
  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      try {
        const data = await sessionsApi.getAll();

        if (!cancelled) {
          setSessions(data);
          setError("");
        }
      } catch (err) {
        console.error("Ошибка загрузки расписания:", err);

        if (!cancelled) {
          setError("Не удалось загрузить расписание занятий.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Дни для календаря
  const days = useMemo(() => getNextSevenDays(), []);

  // Направления из backend
  const services = useMemo(() => {
    const names = sessions.map((session) => session.service_name);

    return [...new Set(names)].sort((a, b) => a.localeCompare(b, "ru"));
  }, [sessions]);

  // Фильтруем занятия
  const filteredSessions = useMemo(() => {
    const now = Date.now();

    return sessions
      .filter((session) => {
        const startsAt = new Date(session.starts_at);

        const matchesDate = getDateKey(startsAt) === selectedDate;

        const matchesService =
          selectedService === "all" || session.service_name === selectedService;

        const isUpcoming = startsAt.getTime() > now;

        return matchesDate && matchesService && isUpcoming;
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
  }, [sessions, selectedDate, selectedService]);

  // Настоящее бронирование через backend
  const handleBooking = async (sessionId: number) => {
    if (bookingSessionId !== null) {
      return;
    }

    // Дожидаемся восстановления авторизации
    if (auth?.isLoading) {
      return;
    }

    // Гость должен сначала войти
    if (!auth?.isAuthenticated || !auth.token) {
      navigate("/login");
      return;
    }

    // Защита от повторного нажатия
    if (bookedSessionIds.includes(sessionId)) {
      setNotification({
        message: "Вы уже записались на это занятие.",
        severity: "info",
      });
      return;
    }

    setBookingSessionId(sessionId);

    try {
      // POST /api/bookings
      const booking = await bookingsApi.createBooking(sessionId, auth.token);

      if (booking.status === "reserved") {
        setBookedSessionIds((prev) =>
          prev.includes(sessionId) ? prev : [...prev, sessionId],
        );

        setNotification({
          message: "Вы успешно записались на занятие!",
          severity: "success",
        });
      } else {
        setNotification({
          message: `Запись создана. Статус: ${booking.status}`,
          severity: "info",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось записаться на занятие";

      setNotification({
        message,
        severity: "error",
      });
    } finally {
      setBookingSessionId(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F8FE",
      }}
    >
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
          <Box sx={{ mb: 5 }}>
            <Typography
              sx={{
                color: "#176BFF",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.08em",
                mb: 2,
              }}
            >
              BLUEPULSE · ТВОЁ ВРЕМЯ ДВИГАТЬСЯ
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
              Расписание занятий
            </Typography>

            <Typography
              sx={{
                color: "#6B819E",
                fontSize: { xs: 15, md: 18 },
                fontWeight: 700,
                lineHeight: 1.6,
                whiteSpace: {
                  xs: "normal",
                  lg: "nowrap",
                },
              }}
            >
              Выбирай удобный день, находи любимые направления и планируй
              тренировки в своём ритме.
            </Typography>
          </Box>

          {/* Основной блок */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #DCE7F3",
              borderRadius: "24px",
              p: { xs: 2, md: 4 },
            }}
          >
            {/* Выбор даты */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 3,
              }}
            >
              <CalendarMonthOutlinedIcon
                sx={{
                  color: "#176BFF",
                  fontSize: 26,
                }}
              />

              <Typography
                component="h2"
                sx={{
                  fontSize: 23,
                  fontWeight: 700,
                  color: "#0A2456",
                }}
              >
                Выбери день
              </Typography>
            </Box>

            {/* Семь ближайших дней */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(4, minmax(0, 1fr))",
                  sm: "repeat(7, minmax(0, 1fr))",
                },
                gap: 1.5,
                mb: 5,
              }}
            >
              {days.map((date) => {
                const dateKey = getDateKey(date);
                const isSelected = selectedDate === dateKey;

                return (
                  <Button
                    key={dateKey}
                    variant={isSelected ? "contained" : "outlined"}
                    onClick={() => setSelectedDate(dateKey)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      py: 2,
                      borderRadius: "14px",
                      borderColor: "#DCE7F3",
                      bgcolor: isSelected ? "#176BFF" : "#F8FBFF",
                      color: isSelected ? "#FFFFFF" : "#0A2456",
                      textTransform: "none",
                      "&:hover": {
                        bgcolor: isSelected ? "#0F57D9" : "#EAF3FF",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {date.toLocaleDateString("ru-RU", {
                        weekday: "short",
                      })}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 23,
                        fontWeight: 700,
                      }}
                    >
                      {date.getDate()}
                    </Typography>

                    <Typography sx={{ fontSize: 12 }}>
                      {date.toLocaleDateString("ru-RU", {
                        month: "short",
                      })}
                    </Typography>
                  </Button>
                );
              })}
            </Box>

            {/* Фильтры */}
            <Typography
              component="h2"
              sx={{
                color: "#0A2456",
                fontSize: 22,
                fontWeight: 700,
                mb: 2,
              }}
            >
              Направление
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                mb: 4,
              }}
            >
              <Chip
                label="Все занятия"
                clickable
                onClick={() => setSelectedService("all")}
                color={selectedService === "all" ? "primary" : "default"}
                variant={selectedService === "all" ? "filled" : "outlined"}
                sx={{
                  fontWeight: 600,
                  px: 1,
                  height: 38,
                }}
              />

              {services.map((serviceName) => (
                <Chip
                  key={serviceName}
                  label={serviceName}
                  clickable
                  onClick={() => setSelectedService(serviceName)}
                  color={
                    selectedService === serviceName ? "primary" : "default"
                  }
                  variant={
                    selectedService === serviceName ? "filled" : "outlined"
                  }
                  sx={{
                    fontWeight: 600,
                    px: 1,
                    height: 38,
                  }}
                />
              ))}
            </Box>

            <Box
              sx={{
                height: "1px",
                bgcolor: "#DCE7F3",
                mb: 4,
              }}
            />

            {/* Загрузка расписания */}
            {loading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 7,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {/* Ошибка загрузки */}
            {!loading && error && (
              <Typography color="error" sx={{ py: 3 }}>
                {error}
              </Typography>
            )}

            {/* Нет занятий */}
            {!loading && !error && filteredSessions.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  py: 7,
                }}
              >
                <EventBusyOutlinedIcon
                  sx={{
                    fontSize: 52,
                    color: "#A8BCD3",
                    mb: 2,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 21,
                    fontWeight: 700,
                    color: "#0A2456",
                    mb: 1,
                  }}
                >
                  На этот день занятий нет
                </Typography>

                <Typography sx={{ color: "#6B819E" }}>
                  Попробуй выбрать другую дату или направление.
                </Typography>
              </Box>
            )}

            {/* Занятия */}
            {!loading && !error && filteredSessions.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {filteredSessions.map((session) => {
                  const canBook = session.status === "open";

                  const isBooking = bookingSessionId === session.id;

                  const isBooked = bookedSessionIds.includes(session.id);

                  return (
                    <Box
                      key={session.id}
                      sx={{
                        display: "flex",
                        alignItems: {
                          xs: "flex-start",
                          md: "center",
                        },
                        flexDirection: {
                          xs: "column",
                          md: "row",
                        },
                        justifyContent: "space-between",
                        gap: 3,
                        p: 3,
                        border: "1px solid #DCE7F3",
                        borderRadius: "17px",
                        transition: "box-shadow 0.2s, transform 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 20px rgba(10,36,86,0.07)",
                        },
                      }}
                    >
                      {/* Время и название */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: "#EAF3FF",
                            color: "#176BFF",
                            borderRadius: "13px",
                            py: 2,
                            px: 2.5,
                            textAlign: "center",
                            minWidth: 110,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 23,
                              fontWeight: 800,
                            }}
                          >
                            {formatTime(session.starts_at)}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            {formatTime(session.ends_at)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography
                            component="h3"
                            sx={{
                              fontSize: 21,
                              fontWeight: 700,
                              color: "#0A2456",
                              mb: 1,
                            }}
                          >
                            {session.service_name}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: 14,
                              color: "#6B819E",
                            }}
                          >
                            {getDuration(session)} мин
                          </Typography>
                        </Box>
                      </Box>

                      {/* Зал и тренер */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.3,
                          minWidth: {
                            xs: "auto",
                            md: 230,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <LocationOnOutlinedIcon
                            sx={{
                              fontSize: 20,
                              color: "#176BFF",
                            }}
                          />

                          <Typography
                            sx={{
                              fontSize: 14,
                              color: "#6B819E",
                            }}
                          >
                            {session.room_name}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <PersonOutlineOutlinedIcon
                            sx={{
                              fontSize: 20,
                              color: "#176BFF",
                            }}
                          />

                          <Typography
                            sx={{
                              fontSize: 14,
                              color: "#6B819E",
                            }}
                          >
                            {session.staff_name || "Тренер не назначен"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Статус и запись */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: {
                            xs: "flex-start",
                            md: "flex-end",
                          },
                          gap: 1.5,
                        }}
                      >
                        <Chip
                          size="small"
                          label={
                            isBooked
                              ? "Вы записаны"
                              : canBook
                                ? "Запись открыта"
                                : "Запись недоступна"
                          }
                          color={isBooked || canBook ? "success" : "default"}
                          variant="outlined"
                        />

                        <Button
                          variant="contained"
                          disabled={
                            !canBook ||
                            isBooked ||
                            bookingSessionId !== null ||
                            Boolean(auth?.isLoading)
                          }
                          endIcon={
                            isBooked ? (
                              <CheckCircleOutlineOutlinedIcon />
                            ) : (
                              <ArrowForwardIcon />
                            )
                          }
                          onClick={() => void handleBooking(session.id)}
                          sx={{
                            borderRadius: "11px",
                            textTransform: "none",
                            fontWeight: 600,
                            px: 2.5,
                            py: 1.2,
                            bgcolor: "#176BFF",
                            "&:hover": {
                              bgcolor: "#0F57D9",
                            },
                          }}
                        >
                          {isBooking
                            ? "Записываем..."
                            : isBooked
                              ? "Вы записаны"
                              : "Записаться"}
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* Уведомление о результате */}
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
          severity={notification?.severity ?? "info"}
          onClose={() => setNotification(null)}
          variant="filled"
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
