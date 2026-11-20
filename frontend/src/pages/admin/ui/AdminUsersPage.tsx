import { useEffect, useState } from "react";
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
import { adminApi, type AdminUser } from "../../../shared/api/admin";

const tableColumns = ["Пользователь", "Email", "Роль", "Статус", "Действия"];

// Роли из таблицы roles: 1 = client, 2 = staff, 3 = admin
const roleLabel = (roleId: number) => {
  switch (roleId) {
    case 1:
      return "Клиент";
    case 2:
      return "Сотрудник";
    case 3:
      return "Администратор";
    default:
      return `Роль #${roleId}`;
  }
};

// «05.11.2026» из ISO-даты
const formatDate = (iso: string) => {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return `${String(date.getDate()).padStart(2, "0")}.${String(
    date.getMonth() + 1
  ).padStart(2, "0")}.${date.getFullYear()}`;
};

// Экран «Пользователи»
export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Диалог профиля
  const [profileUser, setProfileUser] = useState<AdminUser | null>(null);
  const [profileError, setProfileError] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await adminApi.getUsers();

        if (!cancelled) {
          setUsers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить пользователей"
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

  // KPI по ролям
  const clientsCount = users.filter((user) => user.role_id === 1).length;
  const staffCount = users.filter((user) => user.role_id === 2).length;
  const adminsCount = users.filter((user) => user.role_id === 3).length;

  // Блокировка и разблокировка
  const handleToggleStatus = async () => {
    if (!profileUser) {
      return;
    }

    setIsChangingStatus(true);
    setProfileError("");

    try {
      const updated = await adminApi.updateUserStatus(
        profileUser.id,
        !profileUser.is_active
      );

      setUsers((prev) =>
        prev.map((user) => (user.id === updated.id ? updated : user))
      );
      setProfileUser(updated);
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : "Не удалось изменить статус пользователя"
      );
    } finally {
      setIsChangingStatus(false);
    }
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
          Пользователи
        </Typography>

        <Typography
          sx={{ color: "#6B819E", fontSize: 16, mt: "16px", maxWidth: 1060 }}
        >
          Учётные записи, роли и состояние доступа к BluePulse.
        </Typography>
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
        <KpiCard label="Пользователей" value={String(users.length)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Клиентов" value={String(clientsCount)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Сотрудников" value={String(staffCount)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Администраторов" value={String(adminsCount)} accent sx={{ minHeight: 112 }} />
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
                lg: "minmax(0, 280fr) minmax(0, 260fr) minmax(0, 180fr) minmax(0, 180fr) minmax(0, 150fr)",
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

          {users.length === 0 ? (
            <Box sx={{ px: "14px", py: "48px", textAlign: "center" }}>
              <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                Пользователей пока нет.
              </Typography>
            </Box>
          ) : (
            users.map((user, index) => (
              <Box
                key={user.id}
                sx={{
                  px: "14px",
                  display: "grid",
                  alignItems: "center",
                  gridTemplateColumns: {
                    xs: "minmax(0, 2fr) minmax(0, 1fr)",
                    lg: "minmax(0, 280fr) minmax(0, 260fr) minmax(0, 180fr) minmax(0, 180fr) minmax(0, 150fr)",
                  },
                  gap: 1,
                  minHeight: 57,
                  py: "12px",
                  borderBottom:
                    index < users.length - 1 ? "1px solid #DCE7F3" : "none",
                }}
              >
                <Typography
                  sx={{
                    color: user.is_active ? "#102B52" : "#6B819E",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {user.full_name}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {user.email}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {roleLabel(user.role_id)}
                </Typography>
                <Typography
                  sx={{
                    color: user.is_active ? "#148C75" : "#B04A4A",
                    fontSize: 15,
                    fontWeight: user.is_active ? 600 : 400,
                  }}
                >
                  {user.is_active ? "Активен" : "Заблокирован"}
                </Typography>
                <Box>
                  <Button
                    onClick={() => {
                      setProfileError("");
                      setProfileUser(user);
                    }}
                    sx={{
                      color: "#176BFF",
                      fontSize: 15,
                      fontWeight: 600,
                      textTransform: "none",
                      px: 0,
                      minWidth: 0,
                    }}
                  >
                    Профиль
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
          Безопасность доступа
        </Typography>

        <Typography
          sx={{ color: "#6B819E", fontSize: 15, mt: "21px", maxWidth: 1020 }}
        >
          Менять роли и блокировать аккаунты можно только с разрешениями
          администратора.
        </Typography>
      </Box>

      {/* Диалог профиля */}
      <Dialog
        open={profileUser !== null}
        onClose={() => setProfileUser(null)}
        slotProps={{ paper: { sx: { borderRadius: "16px", px: 1 } } }}
      >
        <DialogTitle sx={{ color: "#102B52", fontWeight: 700, fontSize: 20 }}>
          Профиль пользователя
        </DialogTitle>

        <DialogContent>
          {profileUser && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  rowGap: "14px",
                  mt: "8px",
                  mb: "24px",
                }}
              >
                <Typography sx={{ color: "#6B819E", fontSize: 14 }}>
                  Имя
                </Typography>
                <Typography sx={{ color: "#102B52", fontSize: 14, fontWeight: 600 }}>
                  {profileUser.full_name}
                </Typography>

                <Typography sx={{ color: "#6B819E", fontSize: 14 }}>
                  Email
                </Typography>
                <Typography sx={{ color: "#102B52", fontSize: 14 }}>
                  {profileUser.email}
                </Typography>

                <Typography sx={{ color: "#6B819E", fontSize: 14 }}>
                  Телефон
                </Typography>
                <Typography sx={{ color: "#102B52", fontSize: 14 }}>
                  {profileUser.phone ?? "—"}
                </Typography>

                <Typography sx={{ color: "#6B819E", fontSize: 14 }}>
                  Роль
                </Typography>
                <Typography sx={{ color: "#102B52", fontSize: 14 }}>
                  {roleLabel(profileUser.role_id)}
                </Typography>

                <Typography sx={{ color: "#6B819E", fontSize: 14 }}>
                  Регистрация
                </Typography>
                <Typography sx={{ color: "#102B52", fontSize: 14 }}>
                  {formatDate(profileUser.created_at)}
                </Typography>

                <Typography sx={{ color: "#6B819E", fontSize: 14 }}>
                  Статус
                </Typography>
                <Typography
                  sx={{
                    color: profileUser.is_active ? "#148C75" : "#B04A4A",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {profileUser.is_active ? "Активен" : "Заблокирован"}
                </Typography>
              </Box>

              {profileError && (
                <Typography role="alert" sx={{ mb: "16px", fontSize: 13, color: "error.main" }}>
                  {profileError}
                </Typography>
              )}

              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Button
                  onClick={() => setProfileUser(null)}
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
                  Закрыть
                </Button>

                <Button
                  onClick={() => void handleToggleStatus()}
                  disabled={isChangingStatus}
                  sx={{
                    bgcolor: profileUser.is_active ? "#B04A4A" : "#148C75",
                    color: "#FFFFFF",
                    borderRadius: "11px",
                    minHeight: 44,
                    fontWeight: 600,
                    textTransform: "none",
                    flex: 1,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: profileUser.is_active ? "#9A3E3E" : "#0F6E5C",
                      boxShadow: "none",
                    },
                  }}
                >
                  {isChangingStatus
                    ? "Меняем..."
                    : profileUser.is_active
                      ? "Заблокировать"
                      : "Разблокировать"}
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};
