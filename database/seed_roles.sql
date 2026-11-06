
-- Тестовые роли пользователей BluePulse

INSERT INTO public.roles (code)
VALUES
    ('client'),
    ('staff'),
    ('admin')
ON CONFLICT (code) DO NOTHING;
