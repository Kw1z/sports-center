
import { Button, type ButtonProps } from '@mui/material';

// Универсальная кнопка приложения BluePulse
export const AppButton = (props: ButtonProps) => {
  return (
    <Button
      variant="contained"
      color="primary"
      {...props}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        ...props.sx,
      }}
    />
  );
};
