import { useEffect, useState, type FormEvent } from "react";
import {
  Box,
  Button,
  Checkbox,
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
import {
  adminApi,
  type AdminService,
  type AdminStaff,
} from "../../../shared/api/admin";

const tableColumns = ["Сотрудник", "Специализация", "Услуги", "Статус", "Действия"];

// Стили полей в диалогах
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

// Экран «Сотрудники»
export const AdminStaffPage = () => {
  // Справочники
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  // Назначенные услуги каждого сотрудника: id -> названия
  const [servicesByStaff, setServicesByStaff] = useState<
    Record<number, { id: number; name: string }[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Диалог «Настроить»
  const [editStaff, setEditStaff] = useState<AdminStaff | null>(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editServiceIds, setEditServiceIds] = useState<number[]>([]);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Диалог создания
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPosition, setCreatePosition] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Загружаем сотрудников, каталог и связи с услугами
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [staffData, servicesData] = await Promise.all([
          adminApi.getStaff(),
          adminApi.getServices(),
        ]);

        if (cancelled) {
          return;
        }

        setStaff(staffData);
        setServices(servicesData);

        const results = await Promise.all(
          staffData.map(async (employee) => {
            try {
              const assigned = await adminApi.getStaffServices(employee.id);

              return [
                employee.id,
                assigned.map((service) => ({
                  id: service.id,
                  name: service.name,
                })),
              ] as const;
            } catch {
              return [employee.id, []] as const;
            }
          })
        );

        if (!cancelled) {
          setServicesByStaff(Object.fromEntries(results));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить сотрудников"
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

  // KPI по специальностям
  const activeCount = staff.filter((employee) => employee.is_active).length;
  const instructors = staff.filter((employee) =>
    employee.position.toLowerCase().includes("инструктор")
  ).length;
  const masseurs = staff.filter((employee) =>
    employee.position.toLowerCase().includes("массажист")
  ).length;
  const others = staff.length - instructors - masseurs;

  // Открываем диалог настройки
  const openEditDialog = (employee: AdminStaff) => {
    setEditStaff(employee);
    setEditName(employee.display_name);
    setEditPosition(employee.position);
    setEditActive(employee.is_active);
    setEditServiceIds(
      (servicesByStaff[employee.id] ?? []).map((service) => service.id)
    );
    setEditError("");
  };

  // Сохраняем настройки: профиль, статус и список услуг
  const handleSaveEdit = async () => {
    if (!editStaff) {
      return;
    }

    if (!editName.trim() || !editPosition.trim()) {
      setEditError("Укажите имя и специализацию");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    try {
      let updated = editStaff;

      const hasProfileChanged =
        editName.trim() !== editStaff.display_name ||
        editPosition.trim() !== editStaff.position;

      if (hasProfileChanged) {
        updated = await adminApi.updateStaff(editStaff.id, {
          display_name: editName.trim(),
          position: editPosition.trim(),
        });
      }

      if (editActive !== editStaff.is_active) {
        updated = await adminApi.updateStaffStatus(editStaff.id, editActive);
      }

      // Разница в услугах: добавить новые, снять снятые
      const currentIds = (servicesByStaff[editStaff.id] ?? []).map(
        (service) => service.id
      );
      const toAssign = editServiceIds.filter(
        (id) => !currentIds.includes(id)
      );
      const toRemove = currentIds.filter(
        (id) => !editServiceIds.includes(id)
      );

      for (const serviceId of toAssign) {
        await adminApi.assignStaffService(editStaff.id, serviceId);
      }

      for (const serviceId of toRemove) {
        await adminApi.removeStaffService(editStaff.id, serviceId);
      }

      setStaff((prev) =>
        prev.map((employee) => (employee.id === updated.id ? updated : employee))
      );

      // Обновляем список услуг сотрудника
      const refreshed = await adminApi.getStaffServices(editStaff.id);
      setServicesByStaff((prev) => ({
        ...prev,
        [editStaff.id]: refreshed.map((service) => ({
          id: service.id,
          name: service.name,
        })),
      }));

      setEditStaff(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Не удалось сохранить изменения"
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Создаём сотрудника
  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");

    if (!createName.trim() || !createPosition.trim()) {
      setCreateError("Укажите имя и специализацию");
      return;
    }

    setIsCreating(true);

    try {
      const created = await adminApi.createStaff({
        display_name: createName.trim(),
        position: createPosition.trim(),
      });

      setStaff((prev) => [...prev, created]);
      setServicesByStaff((prev) => ({ ...prev, [created.id]: [] }));
      setIsCreateOpen(false);
      setCreateName("");
      setCreatePosition("");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Не удалось создать сотрудника"
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
            Сотрудники
          </Typography>

          <Typography
            sx={{ color: "#6B819E", fontSize: 16, mt: "16px", maxWidth: 1060 }}
          >
            Специалисты клуба и услуги, которые они могут проводить.
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
          + Добавить сотрудника
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
        <KpiCard label="Активных сотрудников" value={String(activeCount)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Инструкторов" value={String(instructors)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Массажистов" value={String(masseurs)} accent sx={{ minHeight: 112 }} />
        <KpiCard label="Другие специалисты" value={String(others < 0 ? 0 : others)} accent sx={{ minHeight: 112 }} />
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
                lg: "minmax(0, 260fr) minmax(0, 220fr) minmax(0, 280fr) minmax(0, 160fr) minmax(0, 150fr)",
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

          {staff.length === 0 ? (
            <Box sx={{ px: "14px", py: "48px", textAlign: "center" }}>
              <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                Сотрудников пока нет — добавьте первого.
              </Typography>
            </Box>
          ) : (
            staff.map((employee, index) => (
              <Box
                key={employee.id}
                sx={{
                  px: "14px",
                  display: "grid",
                  alignItems: "center",
                  gridTemplateColumns: {
                    xs: "minmax(0, 2fr) minmax(0, 1fr)",
                    lg: "minmax(0, 260fr) minmax(0, 220fr) minmax(0, 280fr) minmax(0, 160fr) minmax(0, 150fr)",
                  },
                  gap: 1,
                  minHeight: 57,
                  py: "12px",
                  borderBottom:
                    index < staff.length - 1 ? "1px solid #DCE7F3" : "none",
                }}
              >
                <Typography
                  sx={{
                    color: employee.is_active ? "#102B52" : "#6B819E",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {employee.display_name}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {employee.position}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {(servicesByStaff[employee.id] ?? [])
                    .map((service) => service.name)
                    .join(", ") || "—"}
                </Typography>
                <Typography
                  sx={{
                    color: employee.is_active ? "#148C75" : "#6B819E",
                    fontSize: 15,
                    fontWeight: employee.is_active ? 600 : 400,
                  }}
                >
                  {employee.is_active ? "Активен" : "Неактивен"}
                </Typography>
                <Box>
                  <Button
                    onClick={() => openEditDialog(employee)}
                    sx={{
                      color: "#176BFF",
                      fontSize: 15,
                      fontWeight: 600,
                      textTransform: "none",
                      px: 0,
                      minWidth: 0,
                    }}
                  >
                    Настроить
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
          Связи staff_services
        </Typography>

        <Typography
          sx={{ color: "#6B819E", fontSize: 15, mt: "21px", maxWidth: 1020 }}
        >
          Один сотрудник может вести разные занятия. Для услуг без сотрудника
          назначение необязательно.
        </Typography>
      </Box>

      {/* Диалог настройки сотрудника */}
      <Dialog
        open={editStaff !== null}
        onClose={() => setEditStaff(null)}
        slotProps={{ paper: { sx: { borderRadius: "16px", px: 1 } } }}
      >
        <DialogTitle sx={{ color: "#102B52", fontWeight: 700, fontSize: 20 }}>
          Настройка сотрудника
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={(event) => { event.preventDefault(); void handleSaveEdit(); }} noValidate>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: "20px", mt: "8px" }}>
              <Box sx={{ mb: "21px" }}>
                <FieldLabel>Имя</FieldLabel>
                <AppTextField
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  fullWidth
                  autoFocus
                  sx={inputSx}
                />
              </Box>

              <Box sx={{ mb: "21px" }}>
                <FieldLabel>Специализация</FieldLabel>
                <AppTextField
                  value={editPosition}
                  onChange={(event) => setEditPosition(event.target.value)}
                  fullWidth
                  sx={inputSx}
                />
              </Box>
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
                  Активен
                </Typography>
              }
              sx={{ mb: "16px" }}
            />

            <FieldLabel>Услуги сотрудника</FieldLabel>

            <Box
              sx={{
                bgcolor: "#F4F8FE",
                borderRadius: "11px",
                px: "12px",
                py: "8px",
                mb: "8px",
                maxHeight: 220,
                overflow: "auto",
              }}
            >
              {services.length === 0 ? (
                <Typography sx={{ color: "#6B819E", fontSize: 14, py: "8px" }}>
                  В каталоге нет услуг.
                </Typography>
              ) : (
                services.map((service) => (
                  <FormControlLabel
                    key={service.id}
                    control={
                      <Checkbox
                        checked={editServiceIds.includes(service.id)}
                        onChange={(event) =>
                          setEditServiceIds((prev) =>
                            event.target.checked
                              ? [...prev, service.id]
                              : prev.filter((id) => id !== service.id)
                          )
                        }
                        sx={{ color: "#176BFF", "&.Mui-checked": { color: "#176BFF" } }}
                      />
                    }
                    label={
                      <Typography sx={{ color: "#102B52", fontSize: 14 }}>
                        {service.name} · {service.duration_minutes} мин
                      </Typography>
                    }
                  />
                ))
              )}
            </Box>

            {editError && (
              <Typography role="alert" sx={{ mt: "8px", fontSize: 13, color: "error.main" }}>
                {editError}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: "24px", mb: 2 }}>
              <Button
                onClick={() => setEditStaff(null)}
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

      {/* Диалог создания сотрудника */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "16px", px: 1 } } }}
      >
        <DialogTitle sx={{ color: "#102B52", fontWeight: 700, fontSize: 20 }}>
          Новый сотрудник
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={handleCreate} noValidate>
            <Box sx={{ mt: "8px", mb: "21px" }}>
              <FieldLabel>Имя</FieldLabel>
              <AppTextField
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                fullWidth
                autoFocus
                sx={inputSx}
              />
            </Box>

            <Box sx={{ mb: "21px" }}>
              <FieldLabel>Специализация</FieldLabel>
              <AppTextField
                value={createPosition}
                onChange={(event) => setCreatePosition(event.target.value)}
                fullWidth
                placeholder="Инструктор"
                sx={inputSx}
              />
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
                {isCreating ? "Создаём..." : "Создать сотрудника"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};
