
-- BluePulse: демонстрационные помещения спортивного центра
-- Повторный запуск не создаёт дубликатов

INSERT INTO rooms (
    code,
    name,
    max_capacity,
    is_active
)
VALUES
(
    'studio_a',
    'Зал групповых занятий',
    15,
    TRUE
),
(
    'studio_b',
    'Малый тренировочный зал',
    10,
    TRUE
),
(
    'massage_room',
    'Кабинет массажа',
    2,
    TRUE
),
(
    'cycling_studio',
    'Сайкл-студия',
    14,
    TRUE
),
(
    'stretching_studio',
    'Студия растяжки',
    12,
    TRUE
),
(
    'diagnostics_room',
    'Кабинет диагностики',
    1,
    TRUE
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    max_capacity = EXCLUDED.max_capacity,
    is_active = EXCLUDED.is_active;
