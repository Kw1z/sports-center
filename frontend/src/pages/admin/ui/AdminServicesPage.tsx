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
  MenuItem,
  Switch,
  Typography,
} from "@mui/material";

import { AppTextField } from "../../../shared/ui/AppTextField";
import { KpiCard } from "../../../shared/ui/KpiCard/KpiCard";
import {
  adminApi,
  type AdminService,
  type CreateServiceData,
} from "../../../shared/api/admin";

// «Групповая» / «Индивидуальная» для колонки «Тип»
const typeLabel = (bookingType: string) =>
  bookingType === "group" ? "Групповая" : "Индивидуальная";

// «60 минут» с учётом склонения
const pluralMinutes = (minutes: number) => {
  const lastTwo = minutes % 100;
  const last = minutes % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${minutes} минут`;
  }

  if (last === 1) {
    return `${minutes} минута`;
  }

  if (last >= 2 && last <= 4) {
    return `${minutes} минуты`;
  }

  return `${minutes} минут`;
};

// «1 000 ₽» для колонки «Цена за сеанс»
const formatPrice = (price: number, currencyCode: string) => {
  const formatted = new Intl.NumberFormat("ru-RU").format(price);

  return currencyCode === "RUB" ? `${formatted} ₽` : `${formatted} ${currencyCode}`;
};

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

// Значения формы создания услуги
const emptyCreateForm = {
  code: "",
  name: "",
  description: "",
  bookingType: "group" as "group" | "individual",
  durationMinutes: "60",
  requiresStaff: true,
  price: "",
  currencyCode: "RUB",
};

const tableColumns = ["Название", "Тип", "Длительность", "Цена за сеанс", "Действия"];

// Экран «Услуги и цены»
export const AdminServicesPage = () => {
  // Список услуг из API
  const [services, setServices] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Диалог изменения цены
  const [priceDialogService, setPriceDialogService] =
    useState<AdminService | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [priceError, setPriceError] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Диалог создания услуги
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Загружаем каталог услуг
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await adminApi.getServices();

        if (!cancelled) {
          setServices(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Не удалось загрузить услуги"
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

  // KPI по реальным данным каталога
  const groupCount = services.filter(
    (service) => service.booking_type === "group"
  ).length;
  const individualCount = services.filter(
    (service) => service.booking_type === "individual"
  ).length;
  const activeCount = services.filter((service) => service.is_active).length;

  // Открываем диалог цены с текущим значением
  const openPriceDialog = (service: AdminService) => {
    setPriceDialogService(service);
    setPriceValue(String(service.price));
    setPriceError("");
  };

  // Сохраняем новую цену
  const handleSavePrice = async () => {
    if (!priceDialogService) {
      return;
    }

    const newPrice = Number(priceValue.replace(",", "."));

    if (!Number.isFinite(newPrice) || newPrice < 0) {
      setPriceError("Укажите корректную цену (число от 0)");
      return;
    }

    setIsSavingPrice(true);
    setPriceError("");

    try {
      const updated = await adminApi.updateServicePrice(
        priceDialogService.id,
        newPrice
      );

      // Обновляем строку в списке без перезагрузки страницы
      setServices((prev) =>
        prev.map((service) => (service.id === updated.id ? updated : service))
      );
      setPriceDialogService(null);
    } catch (err) {
      setPriceError(
        err instanceof Error ? err.message : "Не удалось изменить цену"
      );
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleCreateField = <K extends keyof typeof createForm>(
    field: K,
    value: (typeof createForm)[K]
  ) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  // Создаём новую услугу
  const handleCreateService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");

    if (!createForm.name.trim()) {
      setCreateError("Укажите название услуги");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(createForm.code)) {
      setCreateError("Код — латиница в нижнем регистре, цифры и _ (например yoga)");
      return;
    }

    const duration = Number(createForm.durationMinutes);

    if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
      setCreateError("Длительность — целое число от 5 до 480 минут");
      return;
    }

    const price = Number(createForm.price.replace(",", "."));

    if (!Number.isFinite(price) || price < 0) {
      setCreateError("Укажите корректную цену (число от 0)");
      return;
    }

    const payload: CreateServiceData = {
      code: createForm.code,
      name: createForm.name.trim(),
      description: createForm.description.trim() || null,
      booking_type: createForm.bookingType,
      duration_minutes: duration,
      requires_staff: createForm.requiresStaff,
      price,
      currency_code: createForm.currencyCode.toUpperCase(),
    };

    setIsCreating(true);

    try {
      const created = await adminApi.createService(payload);

      setServices((prev) => [...prev, created]);
      setIsCreateOpen(false);
      setCreateForm(emptyCreateForm);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Не удалось создать услугу"
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
            Услуги и цены
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 16,
              mt: "16px",
              maxWidth: 1060,
            }}
          >
            Единый каталог с ценой за сеанс. Стоимость хранения в services.
          </Typography>
        </Box>

        {/* Кнопка добавления услуги */}
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
            "&:hover": {
              bgcolor: "#0F57D9",
              boxShadow: "none",
            },
          }}
        >
          + Добавить услугу
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
        <KpiCard
          label="Услуг в каталоге"
          value={String(services.length)}
          accent
          sx={{ minHeight: 112 }}
        />
        <KpiCard label="Групповых" value={String(groupCount)} accent sx={{ minHeight: 112 }} />
        <KpiCard
          label="Индивидуальных"
          value={String(individualCount)}
          accent
          sx={{ minHeight: 112 }}
        />
        <KpiCard label="Активных" value={String(activeCount)} accent sx={{ minHeight: 112 }} />
      </Box>

      {/* Содержимое таблицы */}
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
          {/* Подложка заголовка таблицы */}
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
                lg: "minmax(0, 300fr) minmax(0, 200fr) minmax(0, 190fr) minmax(0, 190fr) minmax(0, 150fr)",
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

          {/* Строки */}
          {services.length === 0 ? (
            <Box sx={{ px: "14px", py: "48px", textAlign: "center" }}>
              <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                Услуг пока нет — добавьте первую.
              </Typography>
            </Box>
          ) : (
            services.map((service, index) => (
              <Box
                key={service.id}
                sx={{
                  px: "14px",
                  display: "grid",
                  alignItems: "center",
                  gridTemplateColumns: {
                    xs: "minmax(0, 2fr) minmax(0, 1fr)",
                    lg: "minmax(0, 300fr) minmax(0, 200fr) minmax(0, 190fr) minmax(0, 190fr) minmax(0, 150fr)",
                  },
                  gap: 1,
                  minHeight: 57,
                  py: "12px",
                  borderBottom:
                    index < services.length - 1
                      ? "1px solid #DCE7F3"
                      : "none",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: service.is_active ? "#102B52" : "#6B819E",
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    {service.name}
                  </Typography>

                  {service.description && (
                    <Typography
                      sx={{
                        color: "#6B819E",
                        fontSize: 13,
                        mt: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {service.description}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {typeLabel(service.booking_type)}
                </Typography>
                <Typography sx={{ color: "#6B819E", fontSize: 15 }}>
                  {pluralMinutes(service.duration_minutes)}
                </Typography>
                <Typography
                  sx={{ color: "#102B52", fontSize: 15, fontWeight: 600 }}
                >
                  {formatPrice(Number(service.price), service.currency_code)}
                </Typography>
                <Box>
                  <Button
                    onClick={() => openPriceDialog(service)}
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
          Изменение цены
        </Typography>

        <Typography
          sx={{
            color: "#6B819E",
            fontSize: 15,
            mt: "21px",
            maxWidth: 1020,
          }}
        >
          Новая цена применяется к будущим записям. В старых бронированиях
          остаётся цена на момент записи.
        </Typography>
      </Box>

      {/* Диалог изменения цены */}
      <Dialog
        open={priceDialogService !== null}
        onClose={() => setPriceDialogService(null)}
        slotProps={{ paper: { sx: { borderRadius: "16px", px: 1 } } }}
      >
        <DialogTitle sx={{ color: "#102B52", fontWeight: 700, fontSize: 20 }}>
          Изменение цены
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#6B819E", fontSize: 14, mb: "24px" }}>
            Услуга «{priceDialogService?.name}». Новая цена применяется к
            будущим записям.
          </Typography>

          <Box component="form" onSubmit={(event) => { event.preventDefault(); void handleSavePrice(); }} noValidate>
            <FieldLabel>Цена за сеанс</FieldLabel>

            <AppTextField
              type="number"
              value={priceValue}
              onChange={(event) => setPriceValue(event.target.value)}
              fullWidth
              autoFocus
              sx={inputSx}
            />

            {priceError && (
              <Typography
                role="alert"
                sx={{ mt: "16px", fontSize: 13, color: "error.main" }}
              >
                {priceError}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: "28px" }}>
              <Button
                onClick={() => setPriceDialogService(null)}
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
                disabled={isSavingPrice}
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
                {isSavingPrice ? "Сохраняем..." : "Сохранить"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Диалог создания услуги */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "16px", px: 1 } } }}
      >
        <DialogTitle sx={{ color: "#102B52", fontWeight: 700, fontSize: 20 }}>
          Новая услуга
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={handleCreateService} noValidate>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                columnGap: "20px",
                mt: "8px",
              }}
            >
              <Box sx={{ mb: "21px" }}>
                <FieldLabel>Название</FieldLabel>
                <AppTextField
                  value={createForm.name}
                  onChange={(event) =>
                    handleCreateField("name", event.target.value)
                  }
                  fullWidth
                  autoFocus
                  sx={inputSx}
                />
              </Box>

              <Box sx={{ mb: "21px" }}>
                <FieldLabel>Код (a-z, 0-9, _)</FieldLabel>
                <AppTextField
                  value={createForm.code}
                  onChange={(event) =>
                    handleCreateField("code", event.target.value)
                  }
                  fullWidth
                  placeholder="yoga"
                  sx={inputSx}
                />
              </Box>

              <Box sx={{ mb: "21px" }}>
                <FieldLabel>Тип записи</FieldLabel>
                <AppTextField
                  select
                  value={createForm.bookingType}
                  onChange={(event) =>
                    handleCreateField(
                      "bookingType",
                      event.target.value as "group" | "individual"
                    )
                  }
                  fullWidth
                  sx={inputSx}
                >
                  <MenuItem value="group">Групповая</MenuItem>
                  <MenuItem value="individual">Индивидуальная</MenuItem>
                </AppTextField>
              </Box>

              <Box sx={{ mb: "21px" }}>
                <FieldLabel>Длительность (мин)</FieldLabel>
                <AppTextField
                  type="number"
                  value={createForm.durationMinutes}
                  onChange={(event) =>
                    handleCreateField("durationMinutes", event.target.value)
                  }
                  fullWidth
                  slotProps={{ htmlInput: { min: 5, max: 480 } }}
                  sx={inputSx}
                />
              </Box>

              <Box sx={{ mb: "21px" }}>
                <FieldLabel>Цена</FieldLabel>
                <AppTextField
                  type="number"
                  value={createForm.price}
                  onChange={(event) =>
                    handleCreateField("price", event.target.value)
                  }
                  fullWidth
                  sx={inputSx}
                />
              </Box>

              <Box sx={{ mb: "21px" }}>
                <FieldLabel>Валюта</FieldLabel>
                <AppTextField
                  value={createForm.currencyCode}
                  onChange={(event) =>
                    handleCreateField("currencyCode", event.target.value)
                  }
                  fullWidth
                  placeholder="RUB"
                  sx={inputSx}
                />
              </Box>
            </Box>

            <Box sx={{ mb: "21px" }}>
              <FieldLabel>Описание (необязательно)</FieldLabel>
              <AppTextField
                value={createForm.description}
                onChange={(event) =>
                  handleCreateField("description", event.target.value)
                }
                fullWidth
                sx={inputSx}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={createForm.requiresStaff}
                  onChange={(event) =>
                    handleCreateField("requiresStaff", event.target.checked)
                  }
                />
              }
              label={
                <Typography sx={{ color: "#102B52", fontSize: 14 }}>
                  Требует сотрудника
                </Typography>
              }
              sx={{ mb: "8px" }}
            />

            {createError && (
              <Typography
                role="alert"
                sx={{ mt: "16px", fontSize: 13, color: "error.main" }}
              >
                {createError}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: "28px", mb: 2 }}>
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
                {isCreating ? "Создаём..." : "Создать услугу"}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};
