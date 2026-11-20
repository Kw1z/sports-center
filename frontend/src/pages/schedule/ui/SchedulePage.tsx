
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  LinearProgress,
  Slider,
  Snackbar,
  Typography,
} from "@mui/material";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { Header } from "../../../widgets/header/ui/Header";

import { AuthContext } from "../../../features/authorization/model/AuthProvider";

import {
  sessionsApi,
  type TrainingSession,
} from "../../../shared/api/sessions";

import { bookingsApi } from "../../../shared/api/bookings";

// Количество недель для просмотра вперёд
const MAX_WEEK_OFFSET = 8;

// Интервал обновления расписания (30 секунд)
const REFRESH_INTERVAL = 30000;

// Формат даты YYYY-MM-DD
const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Получение ближайшего понедельника.
//
// Например:
// Сегодня пятница, 20 ноября 2026 года.
// Первая неделя: 23–29 ноября.
//
// При переключении ползунка:
// weekOffset = 1 -> 30 ноября – 6 декабря
// weekOffset = 2 -> 7–13 декабря
const getDayWithOffset = (
  weekOffset: number,
  dayOffset = 0
): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 0 = воскресенье, 1 = понедельник
  const dayOfWeek = today.getDay();

  // Дни до ближайшего понедельника
  // Если сегодня понедельник, берём сегодня
  const daysUntilMonday = (8 - dayOfWeek) % 7;

  const date = new Date(today);

  date.setDate(
    today.getDate() +
      daysUntilMonday +
      weekOffset * 7 +
      dayOffset
  );

  return date;
};

// Форматирование времени
const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Продолжительность занятия в минутах
const getDuration = (session: TrainingSession): number => {
  const start = new Date(session.starts_at).getTime();
  const end = new Date(session.ends_at).getTime();

  return Math.round((end - start) / 60000);
};

// Подпись выбранной недели
const getWeekLabel = (weekOffset: number): string => {
  if (weekOffset === 0) {
    return "Ближайшая неделя";
  }

  if (weekOffset === 1) {
    return "Через неделю";
  }

  return `Через ${weekOffset} недель`;
};

// Форматирование диапазона дат недели
const getWeekDateRange = (days: Date[]): string => {
  if (days.length === 0) {
    return "";
  }

  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const start = firstDay.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  const end = lastDay.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${start} — ${end}`;
};

// Тип уведомления
type Notification = {
  message: string;
  severity: "success" | "error" | "info";
};

// Компонент отображения свободных мест
const SessionAvailability = ({
  session,
}: {
  session: TrainingSession;
}) => {
  const {
    capacity,
    booked_count,
    available_spots,
  } = session;

  if (
    booked_count === null ||
    booked_count === undefined ||
    available_spots === null ||
    available_spots === undefined
  ) {
    return (
      <Typography
        sx={{
          color: "#6B819E",
          fontSize: 13,
        }}
      >
        Информация о местах уточняется
      </Typography>
    );
  }

  const total = Math.max(0, capacity);
  const booked = Math.max(0, booked_count);
  const available = Math.max(0, available_spots);

  const progress =
    total > 0
      ? Math.min(100, (booked / total) * 100)
      : 0;

  const isFull = available === 0;

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: { xs: 0, sm: 190 },
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: "#102B52",
          mb: 1,
        }}
      >
        Записалось: {booked} из {total}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: "20px",
          bgcolor: "#EAF3FF",
          mb: 1,
          "& .MuiLinearProgress-bar": {
            borderRadius: "20px",
            bgcolor: isFull ? "#E05252" : "#176BFF",
          },
        }}
      />

      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: isFull ? "#E05252" : "#148C75",
        }}
      >
        {isFull
          ? "Свободных мест нет"
          : `Свободно мест: ${available}`}
      </Typography>
    </Box>
  );
};

// Основная страница расписания
export const SchedulePage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  // Список тренировок
  const [sessions, setSessions] = useState<
    TrainingSession[]
  >([]);

  // Выбранная дата:
  // первый день ближайшей недели (понедельник)
  const [selectedDate, setSelectedDate] = useState(
    () => getDateKey(getDayWithOffset(0))
  );

  // Смещение недель: от 0 до 8
  const [weekOffset, setWeekOffset] = useState(0);

  // Выбранное направление
  const [selectedService, setSelectedService] =
    useState("all");

  // Состояние загрузки
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Занятие, на которое выполняется запись
  const [bookingSessionId, setBookingSessionId] =
    useState<number | null>(null);

  // Занятия, на которые пользователь уже записан
  const [bookedSessionIds, setBookedSessionIds] =
    useState<number[]>([]);

  // Уведомление
  const [notification, setNotification] =
    useState<Notification | null>(null);

  // Семь дней выбранной недели
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      getDayWithOffset(weekOffset, index)
    );
  }, [weekOffset]);

  // Выбранный диапазон дат
  const weekDateRange = useMemo(() => {
    return getWeekDateRange(days);
  }, [days]);

  // Переключение недели ползунком или стрелками
  const changeWeek = (offset: number) => {
    const nextOffset = Math.max(
      0,
      Math.min(MAX_WEEK_OFFSET, offset)
    );

    setWeekOffset(nextOffset);

    // После смены недели выделяем понедельник
    const monday = getDayWithOffset(nextOffset);

    setSelectedDate(getDateKey(monday));
  };

  // Обновление расписания с сервера
  const refreshSessions = useCallback(async () => {
    const data = await sessionsApi.getAll();

    setSessions(data);
    setError("");
  }, []);

  // Первоначальная загрузка расписания
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
        console.error(
          "Ошибка загрузки расписания:",
          err
        );

        if (!cancelled) {
          setError(
            "Не удалось загрузить расписание занятий."
          );
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

  // Автоматическое обновление свободных мест
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshSessions().catch((err) => {
        console.error(
          "Не удалось обновить расписание:",
          err
        );
      });
    };

    const interval = window.setInterval(
      refresh,
      REFRESH_INTERVAL
    );

    document.addEventListener(
      "visibilitychange",
      refresh
    );

    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        refresh
      );

      window.removeEventListener("focus", refresh);
    };
  }, [refreshSessions]);

  // Получаем бронирования пользователя
  useEffect(() => {
    if (auth?.isLoading) {
      return;
    }

    const token = auth?.token;

    if (!token) {
      setBookedSessionIds([]);
      return;
    }

    let cancelled = false;

    const loadMyBookings = async () => {
      try {
        const bookings =
          await bookingsApi.getMyBookings(token);

        if (!cancelled) {
          const reservedIds = bookings
            .filter(
              (booking) =>
                booking.status === "reserved"
            )
            .map(
              (booking) => booking.session_id
            );

          setBookedSessionIds(reservedIds);
        }
      } catch (err) {
        console.error(
          "Не удалось загрузить записи:",
          err
        );
      }
    };

    void loadMyBookings();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, auth?.isLoading]);

  // Направления тренировок
  const services = useMemo(() => {
    const names = sessions.map(
      (session) => session.service_name
    );

    return [...new Set(names)].sort((a, b) =>
      a.localeCompare(b, "ru")
    );
  }, [sessions]);

  // Фильтрация тренировок
  const filteredSessions = useMemo(() => {
    const now = Date.now();

    return sessions
      .filter((session) => {
        const startsAt = new Date(
          session.starts_at
        );

        // Совпадает выбранный день
        const matchesDate =
          getDateKey(startsAt) === selectedDate;

        // Совпадает направление
        const matchesService =
          selectedService === "all" ||
          session.service_name === selectedService;

        // Занятие ещё не началось
        const isUpcoming =
          startsAt.getTime() > now;

        return (
          matchesDate &&
          matchesService &&
          isUpcoming
        );
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() -
          new Date(b.starts_at).getTime()
      );
  }, [
    sessions,
    selectedDate,
    selectedService,
  ]);

  // Запись на тренировку
  const handleBooking = async (sessionId: number) => {
    if (bookingSessionId !== null) {
      return;
    }

    if (auth?.isLoading) {
      return;
    }

    // Если пользователь не авторизован
    if (
      !auth?.isAuthenticated ||
      !auth.token
    ) {
      navigate("/login");
      return;
    }

    // Повторная запись запрещена
    if (bookedSessionIds.includes(sessionId)) {
      setNotification({
        message:
          "Вы уже записались на это занятие.",
        severity: "info",
      });

      return;
    }

    const session = sessions.find(
      (item) => item.id === sessionId
    );

    // Проверяем доступность занятия
    if (
      !session ||
      session.status !== "open" ||
      session.available_spots === 0
    ) {
      setNotification({
        message:
          "На это занятие сейчас нельзя записаться.",
        severity: "error",
      });

      return;
    }

    setBookingSessionId(sessionId);

    try {
      const booking =
        await bookingsApi.createBooking(
          sessionId,
          auth.token
        );

      if (booking.status === "reserved") {
        setBookedSessionIds((prev) =>
          prev.includes(sessionId)
            ? prev
            : [...prev, sessionId]
        );

        setNotification({
          message:
            "Вы успешно записались на занятие!",
          severity: "success",
        });
      } else {
        setNotification({
          message:
            `Запись создана. Статус: ${booking.status}`,
          severity: "info",
        });
      }
    } catch (err) {
      setNotification({
        message:
          err instanceof Error
            ? err.message
            : "Не удалось записаться на занятие",
        severity: "error",
      });
    } finally {
      // Обновляем количество свободных мест
      try {
        await refreshSessions();
      } catch (err) {
        console.error(
          "Не удалось обновить количество мест:",
          err
        );
      }

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
            px: {
              xs: 2,
              sm: 3,
              lg: "48px",
            },
            pt: {
              xs: 4,
              lg: 5,
            },
            pb: 8,
          }}
        >
          {/* Заголовок страницы */}
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
                fontSize: {
                  xs: 32,
                  md: 44,
                },
                fontWeight: 800,
                mb: 2,
              }}
            >
              Расписание занятий
            </Typography>

            <Typography
              sx={{
                color: "#6B819E",
                fontSize: {
                  xs: 15,
                  md: 18,
                },
                fontWeight: 700,
                lineHeight: 1.6,
              }}
            >
              Выбирай удобный день, находи любимые
              направления и планируй тренировки
              в своём ритме.
            </Typography>
          </Box>

          {/* Основная карточка расписания */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #DCE7F3",
              borderRadius: "24px",
              p: {
                xs: 2,
                md: 4,
              },
            }}
          >
            {/* Заголовок календаря */}
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

            {/* Календарь: понедельник — воскресенье */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(4, minmax(0, 1fr))",
                  sm: "repeat(7, minmax(0, 1fr))",
                },
                gap: 1.5,
                mb: 3,
              }}
            >
              {days.map((date) => {
                const dateKey = getDateKey(date);

                const isSelected =
                  selectedDate === dateKey;

                return (
                  <Button
                    key={dateKey}
                    variant={
                      isSelected
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() =>
                      setSelectedDate(dateKey)
                    }
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      py: 2,
                      borderRadius: "14px",
                      borderColor: "#DCE7F3",
                      bgcolor: isSelected
                        ? "#176BFF"
                        : "#F8FBFF",
                      color: isSelected
                        ? "#FFFFFF"
                        : "#0A2456",
                      textTransform: "none",
                      "&:hover": {
                        bgcolor: isSelected
                          ? "#0F57D9"
                          : "#EAF3FF",
                      },
                    }}
                  >
                    {/* Название дня */}
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {date.toLocaleDateString(
                        "ru-RU",
                        {
                          weekday: "short",
                        }
                      )}
                    </Typography>

                    {/* Число */}
                    <Typography
                      sx={{
                        fontSize: 23,
                        fontWeight: 700,
                      }}
                    >
                      {date.getDate()}
                    </Typography>

                    {/* Месяц */}
                    <Typography
                      sx={{
                        fontSize: 12,
                      }}
                    >
                      {date.toLocaleDateString(
                        "ru-RU",
                        {
                          month: "short",
                        }
                      )}
                    </Typography>
                  </Button>
                );
              })}
            </Box>

            {/* Переключение недель */}
            <Box
              sx={{
                bgcolor: "#F8FBFF",
                border: "1px solid #E2EBF7",
                borderRadius: "16px",
                px: {
                  xs: 2,
                  sm: 3,
                },
                py: 2,
                mb: 5,
              }}
            >
              {/* Заголовок ползунка */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    color: "#102B52",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Переключение недель
                </Typography>

                <Chip
                  label={getWeekLabel(weekOffset)}
                  size="small"
                  sx={{
                    color: "#176BFF",
                    bgcolor: "#EAF3FF",
                    fontWeight: 700,
                  }}
                />
              </Box>

              {/* Стрелки и ползунок */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: {
                    xs: 1,
                    sm: 2,
                  },
                }}
              >
                {/* Предыдущая неделя */}
                <IconButton
                  aria-label="Предыдущая неделя"
                  disabled={weekOffset === 0}
                  onClick={() =>
                    changeWeek(weekOffset - 1)
                  }
                  sx={{
                    border: "1px solid #DCE7F3",
                    bgcolor: "#FFFFFF",
                    color: "#176BFF",
                    borderRadius: "11px",
                    width: 44,
                    height: 44,
                    "&:hover": {
                      bgcolor: "#EAF3FF",
                    },
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>

                {/* Ползунок выбора недели */}
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    px: 1,
                  }}
                >
                  <Slider
                    aria-label="Выбор недели расписания"
                    value={weekOffset}
                    min={0}
                    max={MAX_WEEK_OFFSET}
                    step={1}
                    marks
                    onChange={(_, value) => {
                      if (
                        typeof value === "number"
                      ) {
                        changeWeek(value);
                      }
                    }}
                    sx={{
                      color: "#176BFF",
                      "& .MuiSlider-thumb": {
                        width: 20,
                        height: 20,
                      },
                      "& .MuiSlider-rail": {
                        opacity: 1,
                        bgcolor: "#DCE7F3",
                      },
                    }}
                  />
                </Box>

                {/* Следующая неделя */}
                <IconButton
                  aria-label="Следующая неделя"
                  disabled={
                    weekOffset === MAX_WEEK_OFFSET
                  }
                  onClick={() =>
                    changeWeek(weekOffset + 1)
                  }
                  sx={{
                    border: "1px solid #DCE7F3",
                    bgcolor: "#FFFFFF",
                    color: "#176BFF",
                    borderRadius: "11px",
                    width: 44,
                    height: 44,
                    "&:hover": {
                      bgcolor: "#EAF3FF",
                    },
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              {/* Диапазон дат */}
              <Typography
                sx={{
                  color: "#6B819E",
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 500,
                  mt: 1,
                }}
              >
                {weekDateRange}
              </Typography>
            </Box>

            {/* Направления тренировок */}
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
                onClick={() =>
                  setSelectedService("all")
                }
                color={
                  selectedService === "all"
                    ? "primary"
                    : "default"
                }
                variant={
                  selectedService === "all"
                    ? "filled"
                    : "outlined"
                }
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
                  onClick={() =>
                    setSelectedService(serviceName)
                  }
                  color={
                    selectedService === serviceName
                      ? "primary"
                      : "default"
                  }
                  variant={
                    selectedService === serviceName
                      ? "filled"
                      : "outlined"
                  }
                  sx={{
                    fontWeight: 600,
                    px: 1,
                    height: 38,
                  }}
                />
              ))}
            </Box>

            {/* Разделительная линия */}
            <Box
              sx={{
                height: "1px",
                bgcolor: "#DCE7F3",
                mb: 4,
              }}
            />

            {/* Загрузка */}
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
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Пустое расписание */}
            {!loading &&
              !error &&
              filteredSessions.length === 0 && (
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

                  <Typography
                    sx={{
                      color: "#6B819E",
                    }}
                  >
                    Попробуй выбрать другую дату
                    или направление.
                  </Typography>
                </Box>
              )}

            {/* Список тренировок */}
            {!loading &&
              !error &&
              filteredSessions.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {filteredSessions.map((session) => {
                    const isBooking =
                      bookingSessionId === session.id;

                    const isBooked =
                      bookedSessionIds.includes(
                        session.id
                      );

                    const isFull =
                      session.available_spots === 0;

                    const canBook =
                      session.status === "open" &&
                      !isFull;

                    return (
                      <Box
                        key={session.id}
                        sx={{
                          display: "flex",
                          alignItems: {
                            xs: "stretch",
                            lg: "center",
                          },
                          flexDirection: {
                            xs: "column",
                            lg: "row",
                          },
                          justifyContent:
                            "space-between",
                          gap: 3,
                          p: 3,
                          border:
                            "1px solid #DCE7F3",
                          borderRadius: "17px",
                          transition:
                            "box-shadow 0.2s, transform 0.2s",
                          "&:hover": {
                            transform:
                              "translateY(-2px)",
                            boxShadow:
                              "0 8px 20px rgba(10,36,86,0.07)",
                          },
                        }}
                      >
                        {/* Время и название */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flex: 1,
                            minWidth: 0,
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
                              {formatTime(
                                session.starts_at
                              )}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 12,
                              }}
                            >
                              {formatTime(
                                session.ends_at
                              )}
                            </Typography>
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              component="h3"
                              sx={{
                                fontSize: 20,
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
                            flex: 1,
                            minWidth: 0,
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
                              {session.staff_name ||
                                "Тренер не назначен"}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Заполненность занятия */}
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: {
                              xs: 0,
                              lg: 190,
                            },
                            maxWidth: {
                              xs: "100%",
                              lg: 230,
                            },
                          }}
                        >
                          <SessionAvailability
                            session={session}
                          />
                        </Box>

                        {/* Статус и кнопка */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: {
                              xs: "stretch",
                              lg: "flex-end",
                            },
                            gap: 1.5,
                            minWidth: 145,
                          }}
                        >
                          <Chip
                            size="small"
                            label={
                              isBooked
                                ? "Вы записаны"
                                : isFull
                                  ? "Мест нет"
                                  : canBook
                                    ? "Запись открыта"
                                    : "Запись недоступна"
                            }
                            color={
                              isBooked
                                ? "success"
                                : isFull
                                  ? "error"
                                  : canBook
                                    ? "success"
                                    : "default"
                            }
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
                            onClick={() =>
                              void handleBooking(
                                session.id
                              )
                            }
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
                                : isFull
                                  ? "Мест нет"
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

      {/* Уведомления */}
      <Snackbar
        open={notification !== null}
        autoHideDuration={5000}
        onClose={() =>
          setNotification(null)
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity={
            notification?.severity ?? "info"
          }
          onClose={() =>
            setNotification(null)
          }
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
