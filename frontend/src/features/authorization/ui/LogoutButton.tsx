
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { AuthContext } from "../model/AuthProvider";

export const LogoutButton = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth) {
    throw new Error("AuthProvider не подключён");
  }

  const handleLogout = () => {
    auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Button
      variant="outlined"
      color="primary"
      onClick={handleLogout}
      sx={{
        borderRadius: "9px",
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 1.5,
      }}
    >
      Выйти из аккаунта
    </Button>
  );
};
