
import { TextField, type TextFieldProps } from '@mui/material';

// Универсальное поле ввода для всего приложения
export const AppTextField = (props: TextFieldProps) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      size="medium"
      {...props}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
        },
        ...props.sx,
      }}
    />
  );
};
