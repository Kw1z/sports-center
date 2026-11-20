
import { useEffect, useState, type FormEvent } from "react";

import {
  Alert,
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
  TextField,
  Typography,
} from "@mui/material";

import { KpiCard } from "../../../shared/ui/KpiCard/KpiCard";

import {
  adminApi,
  type AdminService,
  type AdminStaff,
  type CreateStaffData,
} from "../../../shared/api/admin";

import { StaffPhotoUpload } from "./StaffPhotoUpload";

// Общие стили
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

const primaryButtonSx = {
  bgcolor: "#176BFF",
  color: "#FFFFFF",
  borderRadius: "11px",
  minHeight: 44,
  fontWeight: 600,
  textTransform: "none",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#0F57D9",
    boxShadow: "none",
  },
};

const secondaryButtonSx = {
  bgcolor: "#EAF3FF",
  color: "#176BFF",
  borderRadius: "11px",
  minHeight: 44,
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    bgcolor: "#DCE7F3",
  },
};

// Поля формы профиля
type StaffForm = {
  display_name: string;
  position: string;
  code: string;
  direction: string;
  specialization: string;
  experience_years: string;
  description: string;
};

// Пустая форма
const emptyStaffForm = (): StaffForm => ({
  display_name: "",
  position: "",
  code: "",
  direction: "",
  specialization: "",
  experience_years: "",
  description: "",
});

// Преобразование ответа backend в форму
const staffToForm = (employee: AdminStaff): StaffForm => ({
  display_name: employee.display_name,
  position: employee.position,
  code: employee.code ?? "",
  direction: employee.direction ?? "",
  specialization: employee.specialization ?? "",
  experience_years:
    employee.experience_years === null
      ? ""
      : String(employee.experience_years),
  description: employee.description ?? "",
});

// Проверяем заполненность профиля тренера
const isProfileComplete = (employee: AdminStaff) =>
  employee.is_active &&
  Boolean(employee.code?.trim()) &&
  Boolean(employee.direction?.trim()) &&
  Boolean(employee.specialization?.trim()) &&
  employee.experience_years !== null &&
  Boolean(employee.description?.trim());

// Проверяем форму перед отправкой
const validateStaffForm = (form: StaffForm): string => {
  if (!form.display_name.trim()) {
    return "Укажите имя сотрудника";
  }

  if (form.display_name.trim().length > 100) {
    return "Имя не должно превышать 100 символов";
  }

  if (!form.position.trim()) {
    return "Укажите должность сотрудника";
  }

  if (form.position.trim().length > 100) {
    return "Должность не должна превышать 100 символов";
  }

  // Профиль можно оставить полностью пустым,
  // если сотрудник пока не готов для каталога.
  const profileValues = [
    form.code,
    form.direction,
    form.specialization,
    form.experience_years,
    form.description,
  ];

  const hasProfileData = profileValues.some(
    (value) => value.trim() !== ""
  );

  if (!hasProfileData) {
    return "";
  }

  if (profileValues.some((value) => !value.trim())) {
    return (
      "Для появления в разделе «Наши тренеры» " +
      "заполните все поля профиля"
    );
  }

  if (!/^[a-z0-9_]{1,40}$/.test(form.code.trim())) {
    return (
      "Код должен содержать от 1 до 40 символов: " +
      "маленькие латинские буквы, цифры и _"
    );
  }

  if (form.direction.trim().length > 80) {
    return "Направление не должно превышать 80 символов";
  }

  if (form.specialization.trim().length > 120) {
    return "Специализация не должна превышать 120 символов";
  }

  const experience = Number(form.experience_years.trim());

  if (
    !/^\d+$/.test(form.experience_years.trim()) ||
    !Number.isInteger(experience) ||
    experience < 0 ||
    experience > 100
  ) {
    return "Стаж должен быть целым числом от 0 до 100";
  }

  return "";
};

// Формируем объект для API
const formToPayload = (form: StaffForm): CreateStaffData => ({
  display_name: form.display_name.trim(),
  position: form.position.trim(),

  code: form.code.trim() || null,
  direction: form.direction.trim() || null,
  specialization: form.specialization.trim() || null,

  experience_years: form.experience_years.trim()
    ? Number(form.experience_years.trim())
    : null,

  description: form.description.trim() || null,
});

// Поля создания/редактирования сотрудника
type StaffFieldsProps = {
  value: StaffForm;
  onChange: (value: StaffForm) => void;
};

const StaffFields = ({
  value,
  onChange,
}: StaffFieldsProps) => {
  const changeField = (
    field: keyof StaffForm,
    newValue: string
  ) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="Имя сотрудника"
          value={value.display_name}
          onChange={(event) =>
            changeField("display_name", event.target.value)
          }
          required
          fullWidth
          autoFocus
          sx={inputSx}
        />

        <TextField
          label="Должность"
          value={value.position}
          onChange={(event) =>
            changeField("position", event.target.value)
          }
          placeholder="Инструктор"
          required
          fullWidth
          sx={inputSx}
        />
      </Box>

      <Box
        sx={{
          borderTop: "1px solid #DCE7F3",
          pt: 3,
          mb: 2,
        }}
      >
        <Typography
          sx={{
            color: "#102B52",
            fontSize: 18,
            fontWeight: 700,
            mb: 1,
          }}
        >
          Профиль тренера
        </Typography>

        <Typography
          sx={{
            color: "#6B819E",
            fontSize: 13,
            lineHeight: 1.6,
            mb: 3,
          }}
        >
          Заполните все поля ниже, чтобы активный
          сотрудник мог появиться на странице
          «Наши тренеры». Если профиль пока не
          нужен, оставьте эти поля пустыми.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            label="Уникальный код тренера"
            value={value.code}
            onChange={(event) =>
              changeField(
                "code",
                event.target.value.toLowerCase()
              )
            }
            placeholder="ivan_petrov"
            helperText="Латинские буквы a-z, цифры и _"
            fullWidth
            sx={inputSx}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
            },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            label="Направление"
            value={value.direction}
            onChange={(event) =>
              changeField("direction", event.target.value)
            }
            placeholder="Фитнес"
            fullWidth
            sx={inputSx}
          />

          <TextField
            label="Специализация тренера"
            value={value.specialization}
            onChange={(event) =>
              changeField(
                "specialization",
                event.target.value
              )
            }
            placeholder="Силовые тренировки"
            fullWidth
            sx={inputSx}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            label="Стаж работы (лет)"
            type="number"
            value={value.experience_years}
            onChange={(event) =>
              changeField(
                "experience_years",
                event.target.value
              )
            }
            slotProps={{
              htmlInput: {
                min: 0,
                max: 100,
                step: 1,
              },
            }}
            fullWidth
            sx={inputSx}
          />
        </Box>

        <TextField
          label="Описание тренера"
          value={value.description}
          onChange={(event) =>
            changeField("description", event.target.value)
          }
          placeholder="Расскажите об опыте и направлении работы"
          fullWidth
          multiline
          minRows={3}
          maxRows={7}
          sx={inputSx}
        />
      </Box>
    </Box>
  );
};

// Главная страница сотрудников
export const AdminStaffPage = () => {
  // Данные из backend
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);

  const [servicesByStaff, setServicesByStaff] = useState<
    Record<number, { id: number; name: string }[]>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Редактирование сотрудника
  const [editStaff, setEditStaff] = useState<AdminStaff | null>(
    null
  );
  const [editForm, setEditForm] = useState<StaffForm>(
    emptyStaffForm()
  );
  const [editActive, setEditActive] = useState(true);
  const [editServiceIds, setEditServiceIds] = useState<number[]>(
    []
  );
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Создание сотрудника
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StaffForm>(
    emptyStaffForm()
  );
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Аккаунт тренера
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] =
    useState(false);

  // Загрузка сотрудников и услуг
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
              const assigned =
                await adminApi.getStaffServices(employee.id);

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

  // Статистика
  const activeCount = staff.filter(
    (employee) => employee.is_active
  ).length;

  const instructors = staff.filter((employee) =>
    employee.position.toLowerCase().includes("инструктор")
  ).length;

  const masseurs = staff.filter((employee) =>
    employee.position.toLowerCase().includes("массажист")
  ).length;

  const others = staff.length - instructors - masseurs;

  // Открытие окна настройки
  const openEditDialog = (employee: AdminStaff) => {
    setEditStaff(employee);
    setEditForm(staffToForm(employee));
    setEditActive(employee.is_active);

    setEditServiceIds(
      (servicesByStaff[employee.id] ?? []).map(
        (service) => service.id
      )
    );

    setEditError("");
    setAccountEmail("");
    setAccountPassword("");
    setAccountError("");
    setAccountSuccess("");
  };

  // Закрытие окна
  const closeEditDialog = () => {
    if (isSavingEdit || isCreatingAccount) {
      return;
    }

    setEditStaff(null);
    setEditError("");
    setAccountEmail("");
    setAccountPassword("");
    setAccountError("");
    setAccountSuccess("");
  };

  // Сохранение сотрудника
  const handleSaveEdit = async () => {
    if (!editStaff || isSavingEdit || isCreatingAccount) {
      return;
    }

    const validationError = validateStaffForm(editForm);

    if (validationError) {
      setEditError(validationError);
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    try {
      const data = formToPayload(editForm);

      let updated = editStaff;

      const hasProfileChanged =
        JSON.stringify(data) !==
        JSON.stringify({
          display_name: editStaff.display_name,
          position: editStaff.position,
          code: editStaff.code,
          direction: editStaff.direction,
          specialization: editStaff.specialization,
          experience_years: editStaff.experience_years,
          description: editStaff.description,
        });

      if (hasProfileChanged) {
        updated = await adminApi.updateStaff(
          editStaff.id,
          data
        );

        setStaff((prev) =>
          prev.map((employee) =>
            employee.id === updated.id ? updated : employee
          )
        );

        setEditStaff(updated);
      }

      if (editActive !== updated.is_active) {
        updated = await adminApi.updateStaffStatus(
          editStaff.id,
          editActive
        );

        setStaff((prev) =>
          prev.map((employee) =>
            employee.id === updated.id ? updated : employee
          )
        );

        setEditStaff(updated);
      }

      // Вычисляем изменения в назначенных услугах
      const currentIds = (
        servicesByStaff[editStaff.id] ?? []
      ).map((service) => service.id);

      const toAssign = editServiceIds.filter(
        (id) => !currentIds.includes(id)
      );

      const toRemove = currentIds.filter(
        (id) => !editServiceIds.includes(id)
      );

      for (const serviceId of toAssign) {
        await adminApi.assignStaffService(
          editStaff.id,
          serviceId
        );
      }

      for (const serviceId of toRemove) {
        await adminApi.removeStaffService(
          editStaff.id,
          serviceId
        );
      }

      const refreshed = await adminApi.getStaffServices(
        editStaff.id
      );

      setServicesByStaff((prev) => ({
        ...prev,
        [editStaff.id]: refreshed.map((service) => ({
          id: service.id,
          name: service.name,
        })),
      }));

      closeEditDialogAfterSave();
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : "Не удалось сохранить сотрудника"
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const closeEditDialogAfterSave = () => {
    setEditStaff(null);
    setEditError("");
    setAccountPassword("");
  };

  // Создание сотрудника
  const handleCreate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationError = validateStaffForm(createForm);

    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const created = await adminApi.createStaff(
        formToPayload(createForm)
      );

      setStaff((prev) => [...prev, created]);

      setServicesByStaff((prev) => ({
        ...prev,
        [created.id]: [],
      }));

      setCreateForm(emptyStaffForm());
      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Не удалось создать сотрудника"
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Создание аккаунта тренера
  const handleCreateAccount = async () => {
    if (
      !editStaff ||
      isCreatingAccount ||
      isSavingEdit
    ) {
      return;
    }

    if (editStaff.user_id !== null) {
      setAccountError("Аккаунт уже создан");
      return;
    }

    const email = accountEmail.trim().toLowerCase();
    const password = accountPassword;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAccountError("Введите корректный email");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setAccountError(
        "Пароль должен содержать от 8 до 128 символов"
      );
      return;
    }

    setIsCreatingAccount(true);
    setAccountError("");
    setAccountSuccess("");

    try {
      const updated = await adminApi.createStaffAccount(
        editStaff.id,
        {
          email,
          password,
        }
      );

      // Обновляем данные сотрудника
      setStaff((prev) =>
        prev.map((employee) =>
          employee.id === updated.id ? updated : employee
        )
      );

      setEditStaff(updated);
      setAccountPassword("");

      if (updated.user_id === null) {
        setAccountError(
          "Сервер не подтвердил создание аккаунта. " +
          "Обновите страницу и проверьте сотрудника."
        );
      } else {
        setAccountSuccess(
          "Аккаунт создан! Тренер может войти " +
          "на сайт с указанными данными."
        );
      }
    } catch (err) {
      setAccountError(
        err instanceof Error
          ? err.message
          : "Не удалось создать аккаунт"
      );
    } finally {
      setIsCreatingAccount(false);
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
      {/* Заголовок */}
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
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
            sx={{
              color: "#6B819E",
              fontSize: 16,
              mt: "16px",
            }}
          >
            Специалисты клуба и услуги, которые они
            могут проводить.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => {
            setCreateForm(emptyStaffForm());
            setCreateError("");
            setIsCreateOpen(true);
          }}
          sx={{
            ...primaryButtonSx,
            px: 2,
          }}
        >
          + Добавить сотрудника
        </Button>
      </Box>

      {/* KPI */}
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
          label="Активных сотрудников"
          value={String(activeCount)}
          accent
          sx={{ minHeight: 112 }}
        />

        <KpiCard
          label="Инструкторов"
          value={String(instructors)}
          accent
          sx={{ minHeight: 112 }}
        />

        <KpiCard
          label="Массажистов"
          value={String(masseurs)}
          accent
          sx={{ minHeight: 112 }}
        />

        <KpiCard
          label="Другие специалисты"
          value={String(Math.max(others, 0))}
          accent
          sx={{ minHeight: 112 }}
        />
      </Box>

      {/* Список сотрудников */}
      {isLoading ? (
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            minHeight: 300,
            mt: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 5 }}>
          {error}
        </Alert>
      ) : (
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            p: 2,
            mt: { xs: 4, lg: "63px" },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 2fr) minmax(0, 1.5fr) " +
                "minmax(0, 2fr) minmax(0, 1fr) " +
                "minmax(0, 1.2fr)",
              gap: 2,
              bgcolor: "#EAF3FF",
              borderRadius: "9px",
              px: 2,
              py: 1.5,
              minWidth: 720,
            }}
          >
            {[
              "Сотрудник",
              "Должность",
              "Услуги",
              "Статус",
              "Действия",
            ].map((column) => (
              <Typography
                key={column}
                sx={{
                  color: "#6B819E",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {column}
              </Typography>
            ))}
          </Box>

          <Box sx={{ overflowX: "auto" }}>
            {staff.length === 0 ? (
              <Typography
                sx={{
                  textAlign: "center",
                  color: "#6B819E",
                  py: 5,
                }}
              >
                Сотрудников пока нет.
              </Typography>
            ) : (
              staff.map((employee) => (
                <Box
                  key={employee.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 2fr) minmax(0, 1.5fr) " +
                      "minmax(0, 2fr) minmax(0, 1fr) " +
                      "minmax(0, 1.2fr)",
                    gap: 2,
                    alignItems: "center",
                    px: 2,
                    py: 2,
                    minWidth: 720,
                    borderBottom: "1px solid #DCE7F3",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: "#102B52",
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      {employee.display_name}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 12,
                        color: isProfileComplete(employee)
                          ? "#148C75"
                          : "#6B819E",
                        mt: 0.5,
                      }}
                    >
                      {isProfileComplete(employee)
                        ? "Профиль тренера заполнен"
                        : "Нет полного профиля тренера"}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      color: "#6B819E",
                      fontSize: 15,
                    }}
                  >
                    {employee.position}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#6B819E",
                      fontSize: 14,
                    }}
                  >
                    {(servicesByStaff[employee.id] ?? [])
                      .map((service) => service.name)
                      .join(", ") || "—"}
                  </Typography>

                  <Typography
                    sx={{
                      color: employee.is_active
                        ? "#148C75"
                        : "#6B819E",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {employee.is_active
                      ? "Активен"
                      : "Неактивен"}
                  </Typography>

                  <Button
                    onClick={() => openEditDialog(employee)}
                    sx={{
                      color: "#176BFF",
                      fontSize: 14,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Настроить
                  </Button>
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {/* Информационный блок */}
      <Box
        sx={{
          bgcolor: "#EAF3FF",
          borderRadius: "16px",
          px: 3,
          py: 3,
          mt: 5,
        }}
      >
        <Typography
          sx={{
            color: "#102B52",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          Управление сотрудниками
        </Typography>

        <Typography
          sx={{
            color: "#6B819E",
            fontSize: 14,
            mt: 1,
          }}
        >
          Для отображения на странице «Наши тренеры»
          заполните профиль и активируйте сотрудника.
          Услуги и аккаунт для входа настраиваются отдельно.
        </Typography>
      </Box>

      {/* Диалог редактирования */}
      <Dialog
        open={editStaff !== null}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              px: 1,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#102B52",
            fontWeight: 700,
            fontSize: 20,
          }}
        >
          Настройка сотрудника
        </DialogTitle>

        <DialogContent>
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveEdit();
            }}
            noValidate
          >
            {/* Поля профиля */}
            <StaffFields
              value={editForm}
              onChange={setEditForm}
            />

            {/* Активность */}
            <FormControlLabel
              control={
                <Switch
                  checked={editActive}
                  onChange={(event) =>
                    setEditActive(event.target.checked)
                  }
                />
              }
              label="Активен"
              sx={{ mb: 2 }}
            />

            {/* Фотография */}
            {editStaff && (
              <StaffPhotoUpload
                key={editStaff.id}
                staffId={editStaff.id}
                staffName={editStaff.display_name}
              />
            )}

            {/* Услуги сотрудника */}
            <Typography
              sx={{
                color: "#102B52",
                fontWeight: 700,
                fontSize: 15,
                mb: 2,
              }}
            >
              Услуги сотрудника
            </Typography>

            <Box
              sx={{
                bgcolor: "#F4F8FE",
                borderRadius: "11px",
                p: 2,
                mb: 2,
                maxHeight: 220,
                overflow: "auto",
              }}
            >
              {services.length === 0 ? (
                <Typography
                  sx={{
                    fontSize: 14,
                    color: "#6B819E",
                  }}
                >
                  В каталоге нет услуг.
                </Typography>
              ) : (
                services.map((service) => (
                  <FormControlLabel
                    key={service.id}
                    control={
                      <Checkbox
                        checked={editServiceIds.includes(
                          service.id
                        )}
                        onChange={(event) =>
                          setEditServiceIds((prev) =>
                            event.target.checked
                              ? [...prev, service.id]
                              : prev.filter(
                                  (id) => id !== service.id
                                )
                          )
                        }
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: 14,
                          color: "#102B52",
                        }}
                      >
                        {service.name} ·{" "}
                        {service.duration_minutes} мин
                      </Typography>
                    }
                  />
                ))
              )}
            </Box>

            {editError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editError}
              </Alert>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 3,
                mb: 2,
              }}
            >
              <Button
                type="button"
                onClick={closeEditDialog}
                disabled={isSavingEdit || isCreatingAccount}
                sx={{
                  ...secondaryButtonSx,
                  flex: 1,
                }}
              >
                Отмена
              </Button>

              <Button
                type="submit"
                disabled={isSavingEdit || isCreatingAccount}
                sx={{
                  ...primaryButtonSx,
                  flex: 1,
                }}
              >
                {isSavingEdit
                  ? "Сохраняем..."
                  : "Сохранить"}
              </Button>
            </Box>
          </Box>

          {/* Аккаунт тренера */}
          {editStaff && (
            <Box
              sx={{
                borderTop: "1px solid #DCE7F3",
                pt: 3,
                pb: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: 18,
                  color: "#102B52",
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                Аккаунт тренера
              </Typography>

              <Typography
                sx={{
                  fontSize: 13,
                  color: "#6B819E",
                  mb: 2,
                }}
              >
                Создайте аккаунт, чтобы тренер мог
                авторизоваться на сайте.
              </Typography>

              {editStaff.user_id !== null ? (
                <Alert severity="success">
                  Аккаунт уже создан. ID пользователя:{" "}
                  {editStaff.user_id}
                </Alert>
              ) : (
                <Box
                  sx={{
                    bgcolor: "#F4F8FE",
                    borderRadius: "12px",
                    p: 2,
                  }}
                >
                  <TextField
                    label="Email тренера"
                    type="email"
                    value={accountEmail}
                    onChange={(event) =>
                      setAccountEmail(event.target.value)
                    }
                    fullWidth
                    autoComplete="off"
                    disabled={isCreatingAccount}
                    sx={{
                      ...inputSx,
                      mb: 2,
                    }}
                  />

                  <TextField
                    label="Пароль"
                    type="password"
                    value={accountPassword}
                    onChange={(event) =>
                      setAccountPassword(event.target.value)
                    }
                    fullWidth
                    autoComplete="new-password"
                    disabled={isCreatingAccount}
                    sx={{
                      ...inputSx,
                      mb: 2,
                    }}
                  />

                  {accountError && (
                    <Alert
                      severity="error"
                      sx={{ mb: 2 }}
                    >
                      {accountError}
                    </Alert>
                  )}

                  <Button
                    type="button"
                    variant="contained"
                    fullWidth
                    disabled={
                      isCreatingAccount || isSavingEdit
                    }
                    onClick={() =>
                      void handleCreateAccount()
                    }
                    sx={primaryButtonSx}
                  >
                    {isCreatingAccount
                      ? "Создаём аккаунт..."
                      : "Создать аккаунт"}
                  </Button>
                </Box>
              )}

              {accountSuccess && (
                <Alert
                  severity="success"
                  sx={{ mt: 2 }}
                >
                  {accountSuccess}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог создания сотрудника */}
      <Dialog
        open={isCreateOpen}
        onClose={() => {
          if (!isCreating) {
            setIsCreateOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              px: 1,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#102B52",
            fontWeight: 700,
            fontSize: 20,
          }}
        >
          Новый сотрудник
        </DialogTitle>

        <DialogContent>
          <Box
            component="form"
            onSubmit={handleCreate}
            noValidate
          >
            <StaffFields
              value={createForm}
              onChange={setCreateForm}
            />

            {createError && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
              >
                {createError}
              </Alert>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 3,
                mb: 2,
              }}
            >
              <Button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
                sx={{
                  ...secondaryButtonSx,
                  flex: 1,
                }}
              >
                Отмена
              </Button>

              <Button
                type="submit"
                disabled={isCreating}
                sx={{
                  ...primaryButtonSx,
                  flex: 1,
                }}
              >
                {isCreating
                  ? "Создаём..."
                  : "Создать сотрудника"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};
