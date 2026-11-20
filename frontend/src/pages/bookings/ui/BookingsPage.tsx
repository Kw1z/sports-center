
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
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
  Divider,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import { Header } from "../../../widgets/header/ui/Header";
import { AuthContext } from "../../../features/authorization/model/AuthProvider";
import { authApi } from "../../../shared/api/auth";
import { bookingsApi, type Booking } from "../../../shared/api/bookings";
import {
  sessionsApi,
  type TrainingSession,
} from "../../../shared/api/sessions";

type BookingTab = "upcoming" | "history";

type Notification = {
  message: string;
  severity: "success" | "error";
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

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

const getBookingStatusLabel = (
  booking: Booking,
  isPast: boolean,
): string => {
  switch (booking.status) {
    case "reserved":
      return isPast ? "Занятие прошло" : "Активная запись";
    case "cancelled":
      return "Отменено";
    case "attended":
      return "Посещено";
    case "no_show":
      return "Не явился";
    default:
      return booking.status;
  }
};

export const BookingsPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const token = auth?.token;
  const authLoading = auth?.isLoading ?? true;

  // Бронирования
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] =
    useState<BookingTab>("upcoming");

  // Окно настроек
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Изменение личных данных
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Изменение пароля
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Отмена бронирования
  const [bookingToCancel, setBookingToCancel] =
    useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [notification, setNotification] =
    useState<Notification | null>(null);

  // Данные текущего пользователя
  const profileName =
    auth?.user?.full_name || "Пользователь BluePulse";

  const profileEmail =
    auth?.user?.email || "Email не указан";

  const initials = profileName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  // Сбрасываем значения полей с паролями
  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setPasswordError("");
    setPasswordSuccess("");
  };

  // Открытие настроек
  const handleOpenSettings = () => {
    setEditName(auth?.user?.full_name ?? "");
    setEditEmail(auth?.user?.email ?? "");
    setEditPhone(auth?.user?.phone ?? "");

    setProfileError("");
    setProfileSuccess("");

    resetPasswordForm();
    setSettingsOpen(true);
  };

  // Закрытие настроек
  const handleCloseSettings = () => {
    if (profileSaving || passwordSaving) return;

    setSettingsOpen(false);
    setProfileError("");
    setProfileSuccess("");
    resetPasswordForm();
  };

  // Сохранение личных данных
  const handleSaveProfile = async () => {
    const fullName = editName.trim();
    const email = editEmail.trim();
    const phone = editPhone.trim();

    setProfileError("");
    setProfileSuccess("");

    if (fullName.length < 2) {
      setProfileError("Имя должно содержать минимум 2 символа");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileError("Введите корректный email");
      return;
    }

    if (phone && !/^\+?[0-9()\s-]{7,20}$/.test(phone)) {
      setProfileError("Введите корректный номер телефона");
      return;
    }

    if (!auth) {
      setProfileError("Необходимо войти в аккаунт");
      return;
    }

    setProfileSaving(true);

    try {
      await auth.updateProfile({
        full_name: fullName,
        email,
        phone: phone || null,
      });

      setProfileSuccess("Данные профиля успешно сохранены!");
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : "Не удалось сохранить изменения",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Сохранение нового пароля
  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!token) {
      setPasswordError("Необходимо войти в аккаунт");
      return;
    }

    if (!currentPassword) {
      setPasswordError("Введите текущий пароль");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "Новый пароль должен содержать минимум 8 символов",
      );
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(
        "Новый пароль должен отличаться от текущего",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Новые пароли не совпадают");
      return;
    }

    setPasswordSaving(true);

    try {
      await authApi.changePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      // Удаляем пароли из полей после успеха
      resetPasswordForm();

      setPasswordSuccess("Пароль успешно изменён!");
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : "Не удалось изменить пароль",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // Выход из аккаунта
  const handleSignOut = () => {
    auth?.signOut();
    navigate("/", { replace: true });
  };

  // Загрузка бронирований
  useEffect(() => {
    if (authLoading) return;

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
        const bookingsData =
          await bookingsApi.getMyBookings(token);

        if (cancelled) return;

        setBookings(bookingsData);

        try {
          const sessionsData = await sessionsApi.getAll();

          if (!cancelled) {
            setSessions(sessionsData);
          }
        } catch (err) {
          console.error(
            "Не удалось загрузить подробности занятий:",
            err,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить записи",
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

  const sessionMap = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions],
  );

  // История определяется по статусу и времени занятия
  const now = Date.now();

  const isHistoryBooking = (booking: Booking): boolean => {
    if (
      ["attended", "no_show", "cancelled"].includes(
        booking.status,
      )
    ) {
      return true;
    }

    const session = sessionMap.get(booking.session_id);

    if (!session) return false;

    const endTime = new Date(session.ends_at).getTime();

    return Number.isFinite(endTime) && endTime <= now;
  };

  const visibleBookings = bookings.filter((booking) =>
    activeTab === "history"
      ? isHistoryBooking(booking)
      : !isHistoryBooking(booking),
  );

  const totalBookings = bookings.length;

  const activeBookings = bookings.filter(
    (booking) => booking.status === "reserved",
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "cancelled",
  ).length;

  // Отмена бронирования
  const handleCancelBooking = async () => {
    if (!bookingToCancel || !token || cancelling) return;

    setCancelling(true);

    try {
      const updatedBooking = await bookingsApi.cancelBooking(
        bookingToCancel.id,
        token,
      );

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === updatedBooking.id
            ? updatedBooking
            : booking,
        ),
      );

      setBookingToCancel(null);

      setNotification({
        message: "Бронирование успешно отменено!",
        severity: "success",
      });
    } catch (err) {
      setNotification({
        message:
          err instanceof Error
            ? err.message
            : "Не удалось отменить запись",
        severity: "error",
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F4F8FE" }}>
      <Header />

      <Container
        component="main"
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
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            flexDirection: { xs: "column", md: "row" },
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
            <Typography
              sx={{
                color: "#0A2456",
                fontSize: 26,
                fontWeight: 700,
                mb: 2,
              }}
            >
              Войди в свой аккаунт
            </Typography>

            <Typography sx={{ color: "#6B819E", mb: 3 }}>
              Чтобы просматривать свои записи,
              необходимо авторизоваться.
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{
                textTransform: "none",
                borderRadius: "12px",
              }}
            >
              Войти
            </Button>
          </Box>
        )}

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

        {/* Личный кабинет */}
        {!loading && !authLoading && token && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "305px minmax(0, 1fr)",
              },
              alignItems: "start",
              gap: { xs: 3, md: 4 },
            }}
          >
            {/* Левая карточка профиля */}
            <Box
              sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid #DCE7F3",
                borderRadius: "20px",
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar
                sx={{
                  width: 94,
                  height: 94,
                  bgcolor: "#EAF3FF",
                  color: "#176BFF",
                  fontSize: 29,
                  fontWeight: 800,
                }}
              >
                {initials || "BP"}
              </Avatar>

              <Typography
                sx={{
                  color: "#0A2456",
                  fontSize: 22,
                  fontWeight: 700,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                }}
              >
                {profileName}
              </Typography>

              <Typography
                sx={{
                  color: "#6B819E",
                  fontSize: 14,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                }}
              >
                {profileEmail}
              </Typography>

              <Chip
                label="Клиент клуба"
                sx={{
                  bgcolor: "#EAF3FF",
                  color: "#176BFF",
                  fontWeight: 600,
                }}
              />

              <Box
                sx={{
                  width: "100%",
                  mt: 2,
                  pt: 2,
                  borderTop: "1px solid #DCE7F3",
                }}
              >
                <Button
                  fullWidth
                  startIcon={<SettingsOutlinedIcon />}
                  onClick={handleOpenSettings}
                  sx={{
                    justifyContent: "flex-start",
                    color: "#0A2456",
                    textTransform: "none",
                    py: 1.5,
                  }}
                >
                  Профиль и настройки
                </Button>

                <Button
                  fullWidth
                  startIcon={<HistoryOutlinedIcon />}
                  onClick={() => setActiveTab("history")}
                  sx={{
                    justifyContent: "flex-start",
                    color:
                      activeTab === "history"
                        ? "#176BFF"
                        : "#0A2456",
                    textTransform: "none",
                    py: 1.5,
                  }}
                >
                  История посещений
                </Button>

                <Button
                  fullWidth
                  startIcon={<LogoutOutlinedIcon />}
                  onClick={handleSignOut}
                  sx={{
                    justifyContent: "flex-start",
                    color: "#B04A4A",
                    textTransform: "none",
                    py: 1.5,
                  }}
                >
                  Выйти из аккаунта
                </Button>
              </Box>
            </Box>

            {/* Правая часть — записи */}
            <Box sx={{ minWidth: 0 }}>
              {error ? (
                <Alert severity="error">{error}</Alert>
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
                      gap: 2,
                      mb: 4,
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
                          borderRadius: "16px",
                          p: 2.5,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#176BFF",
                            fontSize: 30,
                            fontWeight: 800,
                          }}
                        >
                          {item.value}
                        </Typography>

                        <Typography
                          sx={{
                            color: "#6B819E",
                            fontSize: 14,
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Typography
                    component="h2"
                    sx={{
                      color: "#0A2456",
                      fontSize: 25,
                      fontWeight: 700,
                      mb: 2,
                    }}
                  >
                    {activeTab === "upcoming"
                      ? "Предстоящие записи"
                      : "История посещений"}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.5,
                      mb: 3,
                    }}
                  >
                    <Button
                      variant={
                        activeTab === "upcoming"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() => setActiveTab("upcoming")}
                      sx={{
                        textTransform: "none",
                        borderRadius: "10px",
                      }}
                    >
                      Предстоящие
                    </Button>

                    <Button
                      variant={
                        activeTab === "history"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() => setActiveTab("history")}
                      sx={{
                        textTransform: "none",
                        borderRadius: "10px",
                      }}
                    >
                      История
                    </Button>
                  </Box>

                  {visibleBookings.length === 0 && (
                    <Box
                      sx={{
                        bgcolor: "#FFFFFF",
                        border: "1px solid #DCE7F3",
                        borderRadius: "20px",
                        textAlign: "center",
                        py: 7,
                        px: 3,
                      }}
                    >
                      <EventBusyOutlinedIcon
                        sx={{
                          color: "#A8BCD3",
                          fontSize: 60,
                          mb: 2,
                        }}
                      />

                      <Typography
                        sx={{
                          color: "#0A2456",
                          fontSize: 23,
                          fontWeight: 700,
                          mb: 1,
                        }}
                      >
                        {activeTab === "history"
                          ? "История пока пуста"
                          : "Пока нет предстоящих записей"}
                      </Typography>

                      <Typography
                        sx={{
                          color: "#6B819E",
                          mb: 3,
                        }}
                      >
                        {activeTab === "history"
                          ? "Завершённые и отменённые записи появятся здесь."
                          : "Выбери подходящую тренировку и запишись на неё."}
                      </Typography>

                      {activeTab === "upcoming" && (
                        <Button
                          variant="contained"
                          onClick={() => navigate("/schedule")}
                          sx={{
                            borderRadius: "12px",
                            textTransform: "none",
                          }}
                        >
                          Перейти к расписанию
                        </Button>
                      )}
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2.5,
                    }}
                  >
                    {visibleBookings.map((booking) => {
                      const session = sessionMap.get(
                        booking.session_id,
                      );

                      const isActive =
                        booking.status === "reserved";

                      const isPast = isHistoryBooking(booking);

                      const canCancel =
                        isActive &&
                        Boolean(
                          session &&
                            new Date(session.starts_at).getTime() >
                              Date.now(),
                        );

                      return (
                        <Box
                          key={booking.id}
                          sx={{
                            bgcolor: "#FFFFFF",
                            border: "1px solid #DCE7F3",
                            borderRadius: "20px",
                            p: { xs: 3, md: 4 },
                            "&:hover": {
                              boxShadow:
                                "0 8px 25px rgba(10,36,86,0.06)",
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
                              component="h3"
                              sx={{
                                color: "#0A2456",
                                fontSize: {
                                  xs: 21,
                                  md: 24,
                                },
                                fontWeight: 700,
                              }}
                            >
                              {session?.service_name ??
                                `Занятие №${booking.session_id}`}
                            </Typography>

                            <Chip
                              label={getBookingStatusLabel(
                                booking,
                                isPast,
                              )}
                              color={
                                isActive && !isPast
                                  ? "success"
                                  : "default"
                              }
                              variant="outlined"
                            />
                          </Box>

                          {/* Дата, время, зал и тренер */}
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
                                {session?.staff_name ??
                                  "Тренер не указан"}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Стоимость и отмена */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: {
                                xs: "flex-start",
                                sm: "center",
                              },
                              flexDirection: {
                                xs: "column",
                                sm: "row",
                              },
                              gap: 2,
                              pt: 3,
                              borderTop: "1px solid #DCE7F3",
                            }}
                          >
                            <Box>
                              <Typography
                                sx={{
                                  color: "#6B819E",
                                  fontSize: 13,
                                }}
                              >
                                Стоимость записи
                              </Typography>

                              <Typography
                                sx={{
                                  color: "#176BFF",
                                  fontSize: 23,
                                  fontWeight: 800,
                                }}
                              >
                                {formatPrice(
                                  booking.price_at_booking,
                                  booking.currency_at_booking,
                                )}
                              </Typography>
                            </Box>

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
                                Записано:{" "}
                                {formatDate(booking.booked_at)}
                              </Typography>

                              {canCancel && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  onClick={() =>
                                    setBookingToCancel(booking)
                                  }
                                  sx={{
                                    borderRadius: "11px",
                                    textTransform: "none",
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
                </>
              )}
            </Box>
          </Box>
        )}
      </Container>

      {/* ПРОФИЛЬ И НАСТРОЙКИ */}
      <Dialog
        open={settingsOpen}
        onClose={handleCloseSettings}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              p: { xs: 0, sm: 1 },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#0A2456",
            fontWeight: 800,
            fontSize: 24,
          }}
        >
          Профиль и настройки
        </DialogTitle>

        <DialogContent>
          {/* ЛИЧНЫЕ ДАННЫЕ */}
          <Typography
            component="h3"
            sx={{
              color: "#0A2456",
              fontWeight: 700,
              fontSize: 19,
              mb: 2,
              mt: 1,
            }}
          >
            Личные данные
          </Typography>

          <Box
            component="form"
            id="profile-edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveProfile();
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            <TextField
              label="Имя и фамилия"
              value={editName}
              onChange={(event) => {
                setEditName(event.target.value);
                setProfileError("");
                setProfileSuccess("");
              }}
              fullWidth
              required
              disabled={profileSaving}
            />

            <TextField
              label="Электронная почта"
              type="email"
              value={editEmail}
              onChange={(event) => {
                setEditEmail(event.target.value);
                setProfileError("");
                setProfileSuccess("");
              }}
              fullWidth
              required
              disabled={profileSaving}
            />

            <TextField
              label="Номер телефона"
              type="tel"
              value={editPhone}
              onChange={(event) => {
                setEditPhone(event.target.value);
                setProfileError("");
                setProfileSuccess("");
              }}
              placeholder="+79991234567"
              helperText="Необязательное поле"
              fullWidth
              disabled={profileSaving}
            />

            {profileError && (
              <Alert severity="error">{profileError}</Alert>
            )}

            {profileSuccess && (
              <Alert severity="success">{profileSuccess}</Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={profileSaving || passwordSaving}
              sx={{
                bgcolor: "#176BFF",
                borderRadius: "10px",
                textTransform: "none",
                py: 1.5,
                boxShadow: "none",
              }}
            >
              {profileSaving
                ? "Сохраняем..."
                : "Сохранить личные данные"}
            </Button>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* БЕЗОПАСНОСТЬ */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <LockOutlinedIcon sx={{ color: "#176BFF" }} />

            <Typography
              component="h3"
              sx={{
                color: "#0A2456",
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              Безопасность аккаунта
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 14,
              mb: 3,
            }}
          >
            Для изменения пароля необходимо подтвердить
            текущий пароль.
          </Typography>

          <Box
            component="form"
            id="password-change-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleChangePassword();
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            {/* Текущий пароль */}
            <TextField
              label="Текущий пароль"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setPasswordError("");
                setPasswordSuccess("");
              }}
              fullWidth
              required
              autoComplete="current-password"
              disabled={passwordSaving}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowCurrentPassword((value) => !value)
                        }
                        edge="end"
                        aria-label={
                          showCurrentPassword
                            ? "Скрыть текущий пароль"
                            : "Показать текущий пароль"
                        }
                      >
                        {showCurrentPassword ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Новый пароль */}
            <TextField
              label="Новый пароль"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setPasswordError("");
                setPasswordSuccess("");
              }}
              helperText="Минимум 8 символов"
              fullWidth
              required
              autoComplete="new-password"
              disabled={passwordSaving}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowNewPassword((value) => !value)
                        }
                        edge="end"
                        aria-label={
                          showNewPassword
                            ? "Скрыть новый пароль"
                            : "Показать новый пароль"
                        }
                      >
                        {showNewPassword ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Подтверждение нового пароля */}
            <TextField
              label="Повторите новый пароль"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setPasswordError("");
                setPasswordSuccess("");
              }}
              fullWidth
              required
              autoComplete="new-password"
              disabled={passwordSaving}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        edge="end"
                        aria-label={
                          showConfirmPassword
                            ? "Скрыть подтверждение пароля"
                            : "Показать подтверждение пароля"
                        }
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {passwordError && (
              <Alert severity="error">{passwordError}</Alert>
            )}

            {passwordSuccess && (
              <Alert severity="success">{passwordSuccess}</Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={passwordSaving || profileSaving}
              sx={{
                bgcolor: "#176BFF",
                borderRadius: "10px",
                textTransform: "none",
                py: 1.5,
                boxShadow: "none",
              }}
            >
              {passwordSaving
                ? "Изменяем пароль..."
                : "Изменить пароль"}
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseSettings}
            disabled={profileSaving || passwordSaving}
            sx={{
              textTransform: "none",
              color: "#6B819E",
            }}
          >
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Подтверждение отмены бронирования */}
      <Dialog
        open={bookingToCancel !== null}
        onClose={() => {
          if (!cancelling) {
            setBookingToCancel(null);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{ color: "#0A2456", fontWeight: 700 }}
        >
          Отменить запись?
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Ты действительно хочешь отменить бронирование?
            После подтверждения запись получит статус «Отменено».
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            disabled={cancelling}
            onClick={() => setBookingToCancel(null)}
          >
            Назад
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={cancelling}
            onClick={() => void handleCancelBooking()}
          >
            {cancelling
              ? "Отменяем..."
              : "Отменить запись"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления о бронировании */}
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
          sx={{ width: "100%" }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
