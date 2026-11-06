
-- BluePulse: тестовые залы, сотрудники и занятия
-- Перед запуском выполнить seed_services.sql


-- 1. Залы
INSERT INTO rooms (
    code, name, max_capacity, is_active
)
SELECT v.code, v.name, v.max_capacity, TRUE
FROM (
    VALUES
        ('studio_a', 'Зал групповых занятий', 15),
        ('massage_room', 'Кабинет массажа', 2)
) AS v(code, name, max_capacity)
WHERE NOT EXISTS (
    SELECT 1 FROM rooms r WHERE r.code = v.code
);


-- 2. Сотрудники
INSERT INTO staff (
    display_name, position, is_active
)
SELECT v.display_name, v.position, TRUE
FROM (
    VALUES
        ('Анна Тестовая', 'Тренер'),
        ('Мария Тестовая', 'Массажист')
) AS v(display_name, position)
WHERE NOT EXISTS (
    SELECT 1
    FROM staff st
    WHERE st.display_name = v.display_name
);


-- 3. Какие услуги проводят сотрудники
INSERT INTO staff_services (
    staff_id, service_id
)
SELECT st.id, s.id
FROM (
    VALUES
        ('Анна Тестовая', 'yoga'),
        ('Анна Тестовая', 'pilates'),
        ('Мария Тестовая', 'massage')
) AS v(staff_name, service_code)
JOIN staff st ON st.display_name = v.staff_name
JOIN services s ON s.code = v.service_code
WHERE NOT EXISTS (
    SELECT 1
    FROM staff_services ss
    WHERE ss.staff_id = st.id
      AND ss.service_id = s.id
);


-- 4. Предстоящие занятия
WITH planned AS (
    SELECT *
    FROM (
        VALUES
            ('yoga', 'studio_a',
             'Анна Тестовая', 7, 10, 60, 12),

            ('pilates', 'studio_a',
             'Анна Тестовая', 8, 11, 60, 12),

            ('massage', 'massage_room',
             'Мария Тестовая', 7, 13, 45, 1)
    ) AS p(
        service_code,
        room_code,
        staff_name,
        days_ahead,
        start_hour,
        duration_minutes,
        capacity
    )
),
schedule AS (
    SELECT
        *,
        date_trunc('day', CURRENT_TIMESTAMP)
        + make_interval(
            days => days_ahead,
            hours => start_hour
        ) AS start_time
    FROM planned
)
INSERT INTO sessions (
    service_id,
    room_id,
    staff_id,
    starts_at,
    ends_at,
    capacity,
    status
)
SELECT
    s.id,
    r.id,
    st.id,
    p.start_time,
    p.start_time
        + make_interval(mins => p.duration_minutes),
    p.capacity,
    'open'
FROM schedule p
JOIN services s ON s.code = p.service_code
JOIN rooms r ON r.code = p.room_code
JOIN staff st ON st.display_name = p.staff_name
JOIN staff_services ss
    ON ss.staff_id = st.id
    AND ss.service_id = s.id
WHERE s.is_active = TRUE
  AND r.is_active = TRUE
  AND st.is_active = TRUE
  AND p.capacity <= r.max_capacity
  AND NOT EXISTS (
      SELECT 1
      FROM sessions existing
      WHERE existing.service_id = s.id
        AND existing.room_id = r.id
        AND existing.starts_at = p.start_time
  );
