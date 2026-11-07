
import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  InputBase,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

import { Header } from "../../../widgets/header/ui/Header";
import { ServiceCard } from "../../../shared/ui/ServiceCard/ServiceCard";

import {
  servicesApi,
  type Service,
} from "../../../shared/api/services";

type FilterType = "all" | "group" | "individual";

const filters: {
  value: FilterType;
  label: string;
}[] = [
  { value: "all", label: "Все направления" },
  { value: "group", label: "Групповые занятия" },
  { value: "individual", label: "Индивидуальные услуги" },
];

const getServiceCategory = (
  service: Service,
): "group" | "individual" | "other" => {
  const text = `${service.name} ${service.code}`.toLowerCase();

  if (/йога|yoga|пилатес|pilates|сайкл|cycling|cycle|spin|растяж|stretch/.test(text)) {
    return "group";
  }

  if (/массаж|massage|диагност|diagnos/.test(text)) {
    return "individual";
  }

  if (service.booking_type === "group") {
    return "group";
  }

  if (
    service.booking_type === "individual" ||
    service.booking_type === "appointment"
  ) {
    return "individual";
  }

  return "other";
};

export const CatalogPage = () => {
  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] =
    useState<FilterType>("all");

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      try {
        const data = await servicesApi.getAll();

        if (!cancelled) {
          setServices(
            data.filter((service) => service.is_active),
          );
          setError("");
        }
      } catch (err) {
        console.error("Ошибка загрузки каталога:", err);

        if (!cancelled) {
          setError("Не удалось загрузить направления.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        activeFilter === "all" ||
        getServiceCategory(service) === activeFilter;

      const text = [
        service.name,
        service.code,
        service.description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || text.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [services, activeFilter, searchQuery]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F3F7FD",
      }}
    >
      <Header />

      <Container
        component="main"
        maxWidth={false}
        sx={{
          maxWidth: "1440px",
          px: { xs: 2, sm: 3, md: 5.5 },
          pt: { xs: 3, md: 3.5 },
          pb: 7,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              color: "#176BFF",
              fontSize: 11,
              fontWeight: 800,
              mb: 1.1,
            }}
          >
            НАПРАВЛЕНИЯ
          </Typography>

          <Typography
            component="h1"
            sx={{
              color: "#0A2456",
              fontSize: { xs: 29, md: 32 },
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.2,
              mb: 1.1,
            }}
          >
            Выберите своё занятие
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Фильтруйте по типу, длительности и стоимости.
            Все цены — за один сеанс.
          </Typography>
        </Box>

        {/* Поиск */}
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchQuery(searchInput);
          }}
          sx={{
            display: "flex",
            gap: 1.5,
            mb: 2.2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              bgcolor: "#FFFFFF",
              borderRadius: "11px",
              px: 2,
              minHeight: 44,
              flex: 1,
              border: "1px solid transparent",
              "&:focus-within": {
                borderColor: "#176BFF",
              },
            }}
          >
            <SearchIcon
              sx={{
                fontSize: 18,
                color: "#6B819E",
              }}
            />

            <InputBase
              fullWidth
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setSearchQuery(event.target.value);
              }}
              placeholder="Найти йогу, массаж, тренировку..."
              inputProps={{
                "aria-label": "Поиск направления",
              }}
              sx={{
                color: "#0A2456",
                fontSize: 14,
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            sx={{
              width: { xs: "100%", sm: 192 },
              minHeight: 44,
              bgcolor: "#176BFF",
              borderRadius: "11px",
              boxShadow: "none",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 700,
              justifyContent: "flex-start",
              px: 2,
              "&:hover": {
                bgcolor: "#0E56DA",
                boxShadow: "none",
              },
            }}
          >
            Найти
          </Button>
        </Box>

        {/* Фильтры */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 2.5,
          }}
        >
          {filters.map((filter) => {
            const selected = activeFilter === filter.value;

            return (
              <Button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                sx={{
                  minWidth: {
                    xs: "auto",
                    sm: filter.value === "all" ? 134 : 150,
                  },
                  px: 1.6,
                  py: 0.65,
                  minHeight: 27,
                  borderRadius: "30px",
                  textTransform: "none",
                  bgcolor: selected ? "#176BFF" : "#E8F1FE",
                  color: selected ? "#FFFFFF" : "#176BFF",
                  fontSize: 11,
                  fontWeight: 700,
                  "&:hover": {
                    bgcolor: selected ? "#0E56DA" : "#D7E8FF",
                  },
                }}
              >
                {filter.label}
              </Button>
            );
          })}
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 7 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Typography color="error" sx={{ py: 4 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && visibleServices.length === 0 && (
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              borderRadius: "13px",
              p: 5,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0A2456",
                mb: 1,
              }}
            >
              Ничего не найдено
            </Typography>

            <Typography
              sx={{
                color: "#6B819E",
                mb: 2,
              }}
            >
              Попробуйте другой запрос.
            </Typography>

            <Button
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                setActiveFilter("all");
              }}
              sx={{
                textTransform: "none",
                color: "#176BFF",
              }}
            >
              Сбросить фильтры
            </Button>
          </Box>
        )}

        {/* Все карточки теперь берём из shared */}
        {!loading && !error && visibleServices.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2.5,
            }}
          >
            {visibleServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                variant="catalog"
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};
