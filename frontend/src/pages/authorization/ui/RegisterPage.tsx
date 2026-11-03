
import { RegisterForm } from '../../../features/authorization/ui/RegisterForm';
import { AuthLayout } from '../../../widgets/auth-layout/ui/AuthLayout';

export const RegisterPage = () => {
  return (
    <AuthLayout
      title="Начните свою историю движения"
      description="Записывайтесь на любимые занятия, следите за местами и управляйте визитами."
      showActivityCard
    >
      <RegisterForm />
    </AuthLayout>
  );
};
