
-- BluePulse: назначение специалистов на услуги
-- Существующие назначения и занятия сохраняются

INSERT INTO public.staff_services (
    staff_id,
    service_id
)
SELECT
    st.id,
    sv.id
FROM (
    VALUES
        ('anna_smirnova', 'yoga'),
        ('maxim_volkov', 'pilates'),
        ('ekaterina_orlova', 'cycling'),
        ('dmitry_kuznetsov', 'stretching'),
        ('maria_sokolova', 'massage'),
        ('olga_petrova', 'diagnostics')
) AS mapping(staff_code, service_code)
JOIN public.staff AS st
    ON st.code = mapping.staff_code
JOIN public.services AS sv
    ON sv.code = mapping.service_code
ON CONFLICT (staff_id, service_id) DO NOTHING;
