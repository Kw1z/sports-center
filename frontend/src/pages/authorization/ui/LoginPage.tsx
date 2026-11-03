
import { LoginForm } from '../../../features/authorization/ui/LoginForm';
import { AuthLayout } from '../../../widgets/auth-layout/ui/AuthLayout';

export const LoginPage = () => {
  return (
    <AuthLayout
      title="С возвращением в BluePulse!"
      description="Ваши любимые занятия и новые возможности ждут вас. Войдите, чтобы продолжить."
    >
      <LoginForm />
    </AuthLayout>
  );
};
