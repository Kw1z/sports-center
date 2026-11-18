import { useEffect, useState, type FormEvent } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";

import { AppTextField } from "../../../shared/ui/AppTextField";
import { KpiCard } from "../../../shared/ui/KpiCard/KpiCard";
import { adminApi, type AdminRoom } from "../../../shared/api/admin";

const tableColumns = ["Название", "Тип", "Вместимость", "Статус", "Действия"];

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "11px",
    bgcolor: "#FFFFFF",
  },
  "& .MuiOutlinedInput-input": {
    color: "#102B52",
    fontSize: 14,
  },
};

const FieldLabel = ({ children }: { children: string }) => (
  <Typography
    component="label"
    sx={{
      display: "block",
      color: "#102B52",
      fontSize: 14,
      fontWeight: 600,
      mb: "10px",
    }}
  >
    {children}
  </Typography>
);

// «Зал» или «Кабинет»: помещения на одного человека — кабинеты
const roomType = (capacity: number) => (capacity === 1 ? "Кабинет" : "Зал");

// «15 человек» со склонением
const pluralPeople = (count: number) => {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${count} человек`;
  }

  if (last === 1) {
    return `${count} человек`;
  }

  if (last >= 2 && last <= 4) {
    return `${count} человека`;
  }

  return `${count} человек`;
};

const emptyCreateForm = { code: "", name: "", capacity: "10" };

// Экран «Залы и кабинеты»
export const AdminRoomsPage = () => {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Диалог изменения помещения
  const [editRoom, setEditRoom] = useState<AdminRoom | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Диалог создания
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await adminApi.getRooms();

        if (!cancelled) {
          setRooms(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить помещения"
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

  // KPI
  const roomsCount = rooms.filter((room) => room.max_capacity > 1).length;
  const cabinetsCount = rooms.filter((room) => room.max_capacity === 1).length;
  const unavailableCount = rooms.filter((room) => !room.is_active).length;

  const openEditDialog = (room: AdminRoom) => {
    setEditRoom(room);
    setEditName(room.name);
    setEditCapacity(String(room.max_capacity));
    setEditActive(room.is_active);
    setEditError("");
  };

  // Сохраняем название, вместимость и статус
  const handleSaveEdit = async () => {
    if (!editRoom) {
      return;
    }

    if (!editName.trim()) {
      setEditError("Укажите название помещения");
      return;
    }

    const capacity = Number(editCapacity);

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
      setEditError("Вместимость — целое число от 1 до 1000");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    try {
      let updated = editRoom;

      if (editName.trim() !== editRoom.name) {
        updated = await adminApi.updateRoomName(editRoom.id, editName.trim());
      }

      if (capacity !== editRoom.max_capacity) {
        updated = await adminApi.updateRoomCapacity(editRoom.id, capacity);
      }

      if (editActive !== editRoom.is_active) {
        updated = await adminApi.updateRoomStatus(editRoom.id, editActive);
      }

      setRooms((prev) =>
        prev.map((room) => (room.id === updated.id ? updated : room))
      );
      setEditRoom(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Не удалось сохранить изменения"
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Создаём помещение
  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");

    if (!createForm.name.trim()) {
      setCreateError("Укажите название помещения");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(createForm.code)) {
      setCreateError("Код — латиница в нижнем регистре, цифры и _ (например blue_hall)");
      return;
    }

    const capacity = Number(createForm.capacity);

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
      setCreateError("Вместимость — целое число от 1 до 1000");
      return;
    }

    setIsCreating(true);

    try {
      const created = await adminApi.createRoom({
        code: createForm.code,
        name: createForm.name.trim(),
        max_capacity: capacity,
      });

      setRooms((prev) => [...prev, created]);
      setIsCreateOpen(false);
      setCreateForm(emptyCreateForm);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Не удалось создать помещение"
      );
    } finally {
      setIsCreating(false);
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
            Залы и кабинеты
          </Typography>

          <Typography
            sx={{ color: "#6B819E", fontSize: 16, mt: "16px", maxWidth: 1060 }}
          >
            Залы, кабинеты и их вместимость. Для каждого сеанса резервируется
            помещение.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => {
            setCreateError("");
            setIsCreateOpen(true);
          }}
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
            "&:hover": { bgcolor: "#0F57D9", boxShadow: "none" },
          }}
        >
          + Добавить помещение
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
        <KpiCard label="Всего помещений" value={String(rooms.length)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Залы" value={String(roomsCount)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Кабинеты" value={String(cabinetsCount)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Недоступны" value={String(unavailableCount)} accent sx={{ minHeight: 112 }} />
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
                lg: "minmax(0, 280fr) minmax(0, 220fr) minmax(0, 200fr) minmax(0, 180fr) minmax(0, 150fr)",
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

          {rooms.length === 0 ? (
            <Box sx={{ px: "14px", py: "48px", textAlign: "center" }}>
              <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                Помещений пока нет — добавьте первое.
              </Typography>
            </Box>
          ) : (
            rooms.map((room, index) => (
              <Box
                key={room.id}
                sx={{
                  px: "14px",
                  display: "grid",
                  alignItems: "center",
                  gridTemplateColumns: {
                    xs: "minmax(0, 2fr) minmax(0, 1fr)",
                    lg: "minmax(0, 280fr) minmax(0, 220fr) minmax(0, 200fr) minmax(0, 180fr) minmax(0, 150fr)",
                  },
                  gap: 1,
                  minHeight: 57,
                  py: "12px",
                  borderBottom:
                    index < rooms.length - 1 ? "1px solid #DCE7F3" : "none",
                }}
              >
                <Typography
                  sx={{
                    color: room.is_active ? "#102B52" : "#6B819E",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {room.name}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {roomType(room.max_capacity)}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {pluralPeople(room.max_capacity)}
                </Typography>
                <Typography
                  sx={{
                    color: room.is_active ? "#148C75" : "#6B819E",
                    fontSize: 15,
                    fontWeight: room.is_active ? 600 : 400,
                  }}
                >
                  {room.is_active ? "Доступен" : "Недоступен"}
                </Typography>
                <Box>
                  <Button
                    onClick={() => openEditDialog(room)}
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
          Проверка конфликтов
        </Typography>

        <Typography
          sx={{ color: "#6B819E", fontSize: 15, mt: "21px", maxWidth: 1020 }}
        >
          Нельзя назначить два пересекающихся сеанса в один зал или превышать
          его допустимую вместимость.
        </Typography>
      </Box>

      {/* Диалог изменения помещения */}
      <Dialog
        open={editRoom !== null}
        onClose={() => setEditRoom(null)}
        slotProps={{ paper: { sx: { borderRadius: "16px", px: 1 } } }}
      >
        <DialogTitle sx={{ color: "#102B52", fontWeight: 700, fontSize: 20 }}>
          Изменение помещения
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={(event) => { event.preventDefault(); void handleSaveEdit(); }} noValidate>
            <Box sx={{ mt: "8px", mb: "21px" }}>
              <FieldLabel>Название</FieldLabel>
              <AppTextField
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                fullWidth
                autoFocus
                sx={inputSx}
              />
            </Box>

            <Box sx={{ mb: "21px" }}>
              <FieldLabel>Вместимость (человек)</FieldLabel>
              <AppTextField
                type="number"
                value={editCapacity}
                onChange={(event) => setEditCapacity(event.target.value)}
                fullWidth
                slotProps={{ htmlInput: { min: 1, max: 1000 } }}
                sx={inputSx}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={editActive}
                  onChange={(event) => setEditActive(event.target.checked)}
                />
              }
              label={
                <Typography sx={{ color: "#102B52", fontSize: 14 }}>
                  Доступен для бронирования
                </Typography>
              }
              sx={{ mb: "8px" }}
            />

            {editError && (
              <Typography role="alert" sx={{ mt: "8px", fontSize: 13, color: "error.main" }}>
                {editError}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: "24px", mb: 2 }}>
              <Button
                onClick={() => setEditRoom(null)}
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
                Отмена
              </Button>

              <Button
                type="submit"
                disabled={isSavingEdit}
                sx={{
                  bgcolor: "#176BFF",
                  color: "#FFFFFF",
                  borderRadius: "11px",
                  minHeight: 44,
                  fontWeight: 600,
                  textTransform: "none",
                  flex: 1,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#0F57D9", boxShadow: "none" },
                }}
              >
                {isSavingEdit ? "Сохраняем..." : "Сохранить"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Диалог создания помещения */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "16px", px: 1 } } }}
      >
        <DialogTitle sx={{ color: "#102B52", fontWeight: 700, fontSize: 20 }}>
          Новое помещение
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={handleCreate} noValidate>
            <Box sx={{ mt: "8px", mb: "21px" }}>
              <FieldLabel>Название</FieldLabel>
              <AppTextField
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                }
                fullWidth
                autoFocus
                sx={inputSx}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                columnGap: "20px",
                mb: "21px",
              }}
            >
              <Box>
                <FieldLabel>Код (a-z, 0-9, _)</FieldLabel>
                <AppTextField
                  value={createForm.code}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, code: event.target.value }))
                  }
                  fullWidth
                  placeholder="blue_hall"
                  sx={inputSx}
                />
              </Box>

              <Box>
                <FieldLabel>Вместимость (человек)</FieldLabel>
                <AppTextField
                  type="number"
                  value={createForm.capacity}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      capacity: event.target.value,
                    }))
                  }
                  fullWidth
                  slotProps={{ htmlInput: { min: 1, max: 1000 } }}
                  sx={inputSx}
                />
              </Box>
            </Box>

            {createError && (
              <Typography role="alert" sx={{ mt: "8px", fontSize: 13, color: "error.main" }}>
                {createError}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: "24px", mb: 2 }}>
              <Button
                onClick={() => setIsCreateOpen(false)}
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
                Отмена
              </Button>

              <Button
                type="submit"
                disabled={isCreating}
                sx={{
                  bgcolor: "#176BFF",
                  color: "#FFFFFF",
                  borderRadius: "11px",
                  minHeight: 44,
                  fontWeight: 600,
                  textTransform: "none",
                  flex: 1,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#0F57D9", boxShadow: "none" },
                }}
              >
                {isCreating ? "Создаём..." : "Создать помещение"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};
