
-- BluePulse: демонстрационное расписание
-- 6 направлений на ближайшие 10 дней
-- Залы, услуги и тренеры должны быть созданы заранее

WITH templates AS (
    SELECT *
    FROM (
        VALUES
            ('yoga', 'studio_a', 'anna_smirnova', 9, 12),
            ('pilates', 'studio_a', 'maxim_volkov', 11, 10),
            ('cycling', 'cycling_studio', 'ekaterina_orlova', 10, 14),
            ('stretching', 'stretching_studio', 'dmitry_kuznetsov', 12, 12),
            ('massage', 'massage_room', 'maria_sokolova', 13, 1),
            ('diagnostics', 'diagnostics_room', 'olga_petrova', 15, 1)
    ) AS t(
        service_code,
        room_code,
        staff_code,
        start_hour,
        capacity
    )
),
planned AS (
    SELECT
        sv.id AS service_id,
        rm.id AS room_id,
        st.id AS staff_id,
        date_trunc('day', CURRENT_TIMESTAMP)
            + make_interval(
                days => days.day_number,
                hours => t.start_hour
            ) AS starts_at,
        sv.duration_minutes,
        t.capacity
    FROM templates AS t
    CROSS JOIN generate_series(1, 10) AS days(day_number)
    JOIN public.services AS sv
        ON sv.code = t.service_code
    JOIN public.rooms AS rm
        ON rm.code = t.room_code
    JOIN public.staff AS st
        ON st.code = t.staff_code
    JOIN public.staff_services AS ss
        ON ss.staff_id = st.id
       AND ss.service_id = sv.id
    WHERE sv.is_active = TRUE
      AND rm.is_active = TRUE
      AND st.is_active = TRUE
      AND t.capacity <= rm.max_capacity
)
INSERT INTO public.sessions (
    service_id,
    room_id,
    staff_id,
    starts_at,
    ends_at,
    capacity,
    status
)
SELECT
    p.service_id,
    p.room_id,
    p.staff_id,
    p.starts_at,
    p.starts_at
        + make_interval(mins => p.duration_minutes),
    p.capacity,
    'open'
FROM planned AS p
WHERE NOT EXISTS (
    SELECT 1
    FROM public.sessions AS existing
    WHERE existing.status <> 'cancelled'
      AND existing.room_id = p.room_id
      AND existing.starts_at <
          p.starts_at + make_interval(mins => p.duration_minutes)
      AND existing.ends_at > p.starts_at
)
AND NOT EXISTS (
    SELECT 1
    FROM public.sessions AS existing
    WHERE existing.status <> 'cancelled'
      AND existing.staff_id = p.staff_id
      AND existing.starts_at <
          p.starts_at + make_interval(mins => p.duration_minutes)
      AND existing.ends_at > p.starts_at
)
AND NOT EXISTS (
    SELECT 1
    FROM public.sessions AS existing
    WHERE existing.service_id = p.service_id
      AND existing.room_id = p.room_id
      AND existing.starts_at = p.starts_at
);
