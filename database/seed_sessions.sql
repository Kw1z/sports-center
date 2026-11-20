
-- BluePulse: демонстрационное расписание
-- Период: 21 ноября — 31 декабря 2026 года
-- Разные занятия утром, днём и вечером
-- Повторный запуск не создаёт одинаковые занятия

WITH templates AS (
    SELECT *
    FROM (
        VALUES
            -- Основные занятия каждый день
            (
                'yoga', 'studio_a', 'anna_smirnova',
                8, 0, 12,
                ARRAY[1,2,3,4,5,6,7], TRUE
            ),
            (
                'pilates', 'studio_a', 'maxim_volkov',
                10, 0, 10,
                ARRAY[1,2,3,4,5,6,7], TRUE
            ),
            (
                'cycling', 'cycling_studio', 'ekaterina_orlova',
                9, 0, 14,
                ARRAY[1,2,3,4,5,6,7], TRUE
            ),
            (
                'stretching', 'stretching_studio', 'dmitry_kuznetsov',
                11, 0, 12,
                ARRAY[1,2,3,4,5,6,7], TRUE
            ),
            (
                'massage', 'massage_room', 'maria_sokolova',
                12, 0, 1,
                ARRAY[1,2,3,4,5,6,7], TRUE
            ),
            (
                'diagnostics', 'diagnostics_room', 'olga_petrova',
                14, 0, 1,
                ARRAY[1,2,3,4,5,6,7], TRUE
            ),

            -- Вечерняя йога: понедельник, среда, пятница
            (
                'yoga', 'studio_a', 'anna_smirnova',
                17, 30, 12,
                ARRAY[1,3,5], FALSE
            ),

            -- Вечерний пилатес: вторник, четверг, суббота
            (
                'pilates', 'studio_a', 'maxim_volkov',
                19, 0, 10,
                ARRAY[2,4,6], FALSE
            ),

            -- Вечерний сайкл
            (
                'cycling', 'cycling_studio', 'ekaterina_orlova',
                18, 0, 14,
                ARRAY[1,2,4,6], FALSE
            ),

            -- Вечерняя растяжка
            (
                'stretching', 'stretching_studio', 'dmitry_kuznetsov',
                17, 0, 12,
                ARRAY[1,3,5,7], FALSE
            ),

            -- Дополнительный массаж
            (
                'massage', 'massage_room', 'maria_sokolova',
                16, 0, 1,
                ARRAY[2,4,6], FALSE
            ),

            -- Утренняя диагностика
            (
                'diagnostics', 'diagnostics_room', 'olga_petrova',
                10, 0, 1,
                ARRAY[1,3,5], FALSE
            ),

            -- Йога по выходным в малом зале
            (
                'yoga', 'studio_b', 'anna_smirnova',
                15, 0, 10,
                ARRAY[6,7], FALSE
            ),

            -- Пилатес по выходным в малом зале
            (
                'pilates', 'studio_b', 'maxim_volkov',
                16, 0, 10,
                ARRAY[6,7], FALSE
            )

    ) AS t(
        service_code,
        room_code,
        staff_code,
        start_hour,
        start_minute,
        capacity,
        weekdays,
        shift_weekend
    )
),

-- Создаём даты с 21 ноября по 31 декабря.
-- Уже прошедшие даты пропускаем.
calendar AS (
    SELECT
        GREATEST(
            DATE '2026-11-21',
            CURRENT_DATE + 1
        ) + day_number AS session_date
    FROM generate_series(
        0,
        DATE '2026-12-31'
            - GREATEST(
                DATE '2026-11-21',
                CURRENT_DATE + 1
            )
    ) AS days(day_number)
),

-- Соединяем даты с услугами, тренерами и залами
planned AS (
    SELECT
        sv.id AS service_id,
        rm.id AS room_id,
        st.id AS staff_id,

        (
            c.session_date::timestamp
            + make_interval(
                hours => t.start_hour
                    + CASE
                        WHEN t.shift_weekend
                             AND EXTRACT(
                                 ISODOW FROM c.session_date
                             ) IN (6, 7)
                        THEN 1
                        ELSE 0
                      END,
                mins => t.start_minute
            )
        ) AS starts_at,

        sv.duration_minutes,
        t.capacity

    FROM templates AS t
    CROSS JOIN calendar AS c

    JOIN public.services AS sv
        ON sv.code = t.service_code

    JOIN public.rooms AS rm
        ON rm.code = t.room_code

    JOIN public.staff AS st
        ON st.code = t.staff_code

    JOIN public.staff_services AS ss
        ON ss.staff_id = st.id
       AND ss.service_id = sv.id

    WHERE
        EXTRACT(ISODOW FROM c.session_date) = ANY(t.weekdays)
        AND sv.is_active = TRUE
        AND rm.is_active = TRUE
        AND st.is_active = TRUE
        AND t.capacity <= rm.max_capacity
),

-- Добавляем занятия, не создавая конфликтов
inserted AS (
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

    -- Проверяем, что зал свободен
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.sessions AS existing
        WHERE existing.status <> 'cancelled'
          AND existing.room_id = p.room_id
          AND existing.starts_at <
              p.starts_at
              + make_interval(mins => p.duration_minutes)
          AND existing.ends_at > p.starts_at
    )

    -- Проверяем, что тренер свободен
    AND NOT EXISTS (
        SELECT 1
        FROM public.sessions AS existing
        WHERE existing.status <> 'cancelled'
          AND existing.staff_id = p.staff_id
          AND existing.starts_at <
              p.starts_at
              + make_interval(mins => p.duration_minutes)
          AND existing.ends_at > p.starts_at
    )

    -- Защита от одинаковых занятий
    AND NOT EXISTS (
        SELECT 1
        FROM public.sessions AS existing
        WHERE existing.service_id = p.service_id
          AND existing.room_id = p.room_id
          AND existing.starts_at = p.starts_at
    )

    RETURNING id
)

SELECT COUNT(*) AS created_sessions
FROM inserted;
