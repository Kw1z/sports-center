import { useEffect, useState, type FormEvent } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { AppTextField } from "../../../shared/ui/AppTextField";
import {
  adminApi,
  type AdminRoom,
  type AdminService,
  type AdminStaff,
} from "../../../shared/api/admin";

// Чек-лист проверок перед сохранением (тексты из макета)
const checks = [
  "Услуга активна",
  "Зал доступен",
  "Время не пересекается",
  "Вместимость допустима",
  "Сотрудник подходит",
];

// Стили полей формы (из макета)
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "11px",
    height: 49,
    bgcolor: "#FFFFFF",
  },
  "& .MuiOutlinedInput-input": {
    color: "#6B819E",
    fontSize: 14,
    padding: "12px 14px",
  },
};

// Подпись над полем формы
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

// Дата в формате YYYY-MM-DD для <input type="date">
const todayIso = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
};

type FormState = {
  serviceId: number | "";
  roomId: number | "";
  staffId: number | "";
  date: string;
  startTime: string;
  capacity: string;
};

// Экран «Создание сеанса»: форма отправляется в POST /api/admin/sessions
export const AdminCreateSessionPage = () => {
  const navigate = useNavigate();

  // Справочники из API
  const [services, setServices] = useState<AdminService[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState<FormState>({
    serviceId: "",
    roomId: "",
    staffId: "",
    date: todayIso(),
    startTime: "09:00",
    capacity: "15",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем услуги, залы и сотрудников
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const [servicesData, roomsData, staffData] = await Promise.all([
          adminApi.getServices(),
          adminApi.getRooms(),
          adminApi.getStaff(),
        ]);

        if (cancelled) {
          return;
        }

        const activeServices = servicesData.filter(
          (service) => service.is_active
        );
        const activeRooms = roomsData.filter((room) => room.is_active);
        const activeStaff = staffData.filter((employee) => employee.is_active);

        setServices(activeServices);
        setRooms(activeRooms);
        setStaff(activeStaff);

        // Выбираем первые значения по умолчанию
        setForm((prev) => ({
          ...prev,
          serviceId: activeServices[0]?.id ?? "",
          roomId: activeRooms[0]?.id ?? "",
          staffId: activeStaff[0]?.id ?? "",
        }));
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить справочники"
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

  const selectedService = services.find(
    (service) => service.id === form.serviceId
  );

  // Окончание сеанса считается автоматически из длительности услуги
  const endTime = (() => {
    if (!selectedService || !form.startTime) {
      return "";
    }

    const start = new Date(`${form.date}T${form.startTime}`);

    if (Number.isNaN(start.getTime())) {
      return "";
    }

    const end = new Date(
      start.getTime() + selectedService.duration_minutes * 60000
    );

    return `${String(end.getHours()).padStart(2, "0")}:${String(
      end.getMinutes()
    ).padStart(2, "0")}`;
  })();

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    // Клиентская валидация — конфликты всё равно проверяет сервер
    if (!form.serviceId || !form.roomId || !form.date || !form.startTime) {
      setFormError("Выберите услугу, зал, дату и время начала");
      return;
    }

    const capacity = Number(form.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      setFormError("Укажите количество мест (целое число от 1)");
      return;
    }

    const selectedRoom = rooms.find((room) => room.id === form.roomId);

    if (selectedRoom && capacity > selectedRoom.max_capacity) {
      setFormError(
        `Вместимость зала «${selectedRoom.name}» — не более ${selectedRoom.max_capacity} мест`
      );
      return;
    }

    if (selectedService?.requires_staff && !form.staffId) {
      setFormError("Для этой услуги необходимо назначить сотрудника");
      return;
    }

    const startsAt = new Date(`${form.date}T${form.startTime}`);

    if (Number.isNaN(startsAt.getTime())) {
      setFormError("Проверьте дату и время начала");
      return;
    }

    const endsAt = new Date(
      startsAt.getTime() + (selectedService?.duration_minutes ?? 0) * 60000
    );

    setIsSubmitting(true);

    try {
      await adminApi.createSession({
        service_id: form.serviceId,
        room_id: form.roomId,
        staff_id: form.staffId === "" ? null : form.staffId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        capacity,
        status: "open",
      });

      // После создания возвращаемся к списку сеансов
      navigate("/admin/sessions", {
        state: { message: "Сеанс создан" },
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Не удалось создать сеанс"
      );
    } finally {
      setIsSubmitting(false);
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
            Создание сеанса
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 16,
              mt: "16px",
              maxWidth: 1060,
            }}
          >
            Форма создания занятия с проверкой занятости сотрудника и зала.
          </Typography>
        </Box>

        {/* Вторичная кнопка возврата к списку */}
        <Button
          onClick={() => navigate("/admin/sessions")}
          sx={{
            bgcolor: "#EAF3FF",
            color: "#176BFF",
            borderRadius: "11px",
            minHeight: 44,
            px: "15px",
            fontWeight: 600,
            fontSize: 15,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#DCE7F3",
            },
          }}
        >
          ← К списку
        </Button>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
          }}
        >
          <CircularProgress />
        </Box>
      ) : loadError ? (
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: "16px",
            px: "24px",
            py: "48px",
            mt: { xs: 3, lg: "61px" },
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: "error.main", fontSize: 16 }}>
            {loadError}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 745fr) minmax(0, 330fr)",
            },
            gap: { xs: 3, lg: "25px" },
            mt: { xs: 4, lg: "61px" },
            alignItems: "start",
          }}
        >
          {/* Форма */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              bgcolor: "#EAF3FF",
              borderRadius: "18px",
              px: "30px",
              py: "24px",
            }}
          >
            <Typography
              component="h2"
              sx={{ color: "#102B52", fontSize: 24, fontWeight: 700 }}
            >
              Параметры нового сеанса
            </Typography>

            {/* Сетка полей в 2 колонки */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 320fr) minmax(0, 328fr)",
                },
                columnGap: "23px",
                rowGap: "21px",
                mt: "32px",
              }}
            >
              {/* Строка 1 */}
              <Box>
                <FieldLabel>Услуга</FieldLabel>
                <AppTextField
                  select
                  value={form.serviceId}
                  onChange={(event) =>
                    handleChange("serviceId", Number(event.target.value))
                  }
                  sx={inputSx}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {service.name} · {service.duration_minutes} мин
                    </MenuItem>
                  ))}
                </AppTextField>
              </Box>
              <Box>
                <FieldLabel>Дата</FieldLabel>
                <AppTextField
                  type="date"
                  value={form.date}
                  onChange={(event) => handleChange("date", event.target.value)}
                  sx={inputSx}
                />
              </Box>

              {/* Строка 2 */}
              <Box>
                <FieldLabel>Начало</FieldLabel>
                <AppTextField
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    handleChange("startTime", event.target.value)
                  }
                  sx={inputSx}
                />
              </Box>
              <Box>
                <FieldLabel>Окончание (по услуге)</FieldLabel>
                <AppTextField
                  value={endTime}
                  slotProps={{ input: { readOnly: true } }}
                  sx={inputSx}
                />
              </Box>

              {/* Строка 3 */}
              <Box>
                <FieldLabel>Помещение</FieldLabel>
                <AppTextField
                  select
                  value={form.roomId}
                  onChange={(event) =>
                    handleChange("roomId", Number(event.target.value))
                  }
                  sx={inputSx}
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name} · до {room.max_capacity} мест
                    </MenuItem>
                  ))}
                </AppTextField>
              </Box>
              <Box>
                <FieldLabel>Сотрудник (необязательно)</FieldLabel>
                <AppTextField
                  select
                  value={form.staffId}
                  onChange={(event) =>
                    handleChange(
                      "staffId",
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value)
                    )
                  }
                  sx={inputSx}
                >
                  <MenuItem value="">Не назначен</MenuItem>
                  {staff.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.display_name}
                    </MenuItem>
                  ))}
                </AppTextField>
              </Box>

              {/* Строка 4: поле мест + кнопка сохранения */}
              <Box>
                <FieldLabel>Количество мест</FieldLabel>
                <AppTextField
                  type="number"
                  value={form.capacity}
                  onChange={(event) =>
                    handleChange("capacity", event.target.value)
                  }
                  slotProps={{
                    htmlInput: { min: 1, max: 1000 },
                  }}
                  sx={inputSx}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                <Button
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: "#176BFF",
                    color: "#FFFFFF",
                    borderRadius: "11px",
                    minHeight: 44,
                    fontWeight: 600,
                    fontSize: 15,
                    textTransform: "none",
                    boxShadow: "none",
                    mb: "5px",
                    "&:hover": {
                      bgcolor: "#0F57D9",
                      boxShadow: "none",
                    },
                  }}
                >
                  {isSubmitting ? "Сохраняем..." : "Сохранить сеанс"}
                </Button>
              </Box>
            </Box>

            {formError && (
              <Typography
                role="alert"
                sx={{
                  mt: "24px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "error.main",
                }}
              >
                {formError}
              </Typography>
            )}
          </Box>

          {/* Блок проверок */}
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "17px",
              px: "21px",
              py: "26px",
            }}
          >
            <Typography
              component="h2"
              sx={{
                color: "#102B52",
                fontSize: 21,
                fontWeight: 700,
                maxWidth: 270,
              }}
            >
              Проверки перед сохранением
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                mt: "32px",
              }}
            >
              {checks.map((check) => (
                <Typography
                  key={check}
                  sx={{ color: "#6B819E", fontSize: 16 }}
                >
                  ✓ {check}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
};
