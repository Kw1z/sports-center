
-- Тестовые услуги спортивного центра BluePulse

INSERT INTO services (
    code,
    name,
    description,
    booking_type,
    duration_minutes,
    requires_staff,
    price,
    currency_code,
    is_active
)
VALUES
(
    'yoga',
    'Йога',
    'Групповое занятие йогой',
    'group',
    60,
    TRUE,
    800.00,
    'RUB',
    TRUE
),
(
    'pilates',
    'Пилатес',
    'Групповое занятие пилатесом',
    'group',
    60,
    TRUE,
    900.00,
    'RUB',
    TRUE
),
(
    'massage',
    'Массаж',
    'Индивидуальный массаж',
    'individual',
    45,
    TRUE,
    2000.00,
    'RUB',
    TRUE
)
ON CONFLICT (code) DO NOTHING;
