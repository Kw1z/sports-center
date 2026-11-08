
import { Box, Container, Typography } from "@mui/material";

import { Header } from "../../../widgets/header/ui/Header";
import { TrainerCard } from "../../../shared/ui/TrainerCard/TrainerCard";

// Временные данные из макета Figma.
//
// Пока в backend только тестовые сотрудники.
// Когда друг добавит всех тренеров и API для них,
// заменим этот массив загрузкой из базы данных.

type Trainer = {
  id: number;
  name: string;
  direction: string;
  image?: string;
  specialization: string;
  experience?: string;
  description: string;
};

const trainers: Trainer[] = [
  {
    id: 1,
    name: "Анна Смирнова",
    direction: "Йога",
    specialization: "Инструктор по йоге",
    description:
      "Проводит занятия йогой, уделяя внимание правильной технике, дыханию и развитию гибкости.",
  },
  {
    id: 2,
    name: "Максим Волков",
    direction: "Пилатес",
    specialization: "Инструктор по пилатесу",
    description:
      "Помогает укреплять мышцы корпуса, улучшать осанку и развивать координацию движений.",
  },
  {
    id: 3,
    name: "Екатерина Орлова",
    direction: "Сайкл",
    specialization: "Инструктор по сайклу",
    description:
      "Проводит динамичные кардиотренировки на велотренажёрах с акцентом на выносливость.",
  },
  {
    id: 4,
    name: "Дмитрий Кузнецов",
    direction: "Растяжка",
    specialization: "Инструктор по растяжке",
    description:
      "Помогает развивать гибкость, улучшать подвижность суставов и расслаблять мышцы.",
  },
  {
    id: 5,
    name: "Мария Соколова",
    direction: "Массаж",
    specialization: "Специалист по массажу",
    description:
      "Занимается массажем, направленным на расслабление мышц и восстановление после нагрузок.",
  },
  {
    id: 6,
    name: "Ольга Петрова",
    direction: "Диагностика",
    specialization: "Специалист по диагностике",
    description:
      "Проводит оценку состояния организма и помогает разобраться в показателях состава тела.",
  },
];

export const TrainersPage = () => {
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
          pb: 8,
        }}
      >
        {/* Заголовок по макету Figma */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              color: "#176BFF",
              fontSize: 11,
              fontWeight: 800,
              mb: 1.4,
            }}
          >
            КОМАНДА BLUEPULSE
          </Typography>

          <Typography
            component="h1"
            sx={{
              color: "#0A2456",
              fontSize: { xs: 29, md: 32 },
              fontWeight: 800,
              letterSpacing: "-0.035em",
              mb: 1,
            }}
          >
            Наши тренеры
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Шесть направлений — шесть специалистов.
            Наведите на фотографию, чтобы узнать больше.
          </Typography>
        </Box>

        {/* Сетка карточек 3 × 2 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {trainers.map((trainer) => (
            <TrainerCard
              key={trainer.id}
              name={trainer.name}
              direction={trainer.direction}
              image={trainer.image}
              specialization={trainer.specialization}
              experience={trainer.experience}
              description={trainer.description}
            />
          ))}
        </Box>
      </Container>
    </Box>
  );
};
