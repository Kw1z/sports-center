
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import { HomePage } from "./pages/home/ui/HomePage";
import { AboutPage } from "./pages/about/ui/AboutPage";
import { LoginPage } from "./pages/authorization/ui/LoginPage";
import { RegisterPage } from "./pages/authorization/ui/RegisterPage";
import { ProtectedRoute } from "./features/authorization/ui/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Главная страница */}
        <Route path="/" element={<HomePage />} />

        {/* О клубе */}
        <Route path="/about" element={<AboutPage />} />

        {/* Авторизация и регистрация */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Личный кабинет */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div style={{ padding: 40 }}>
                <h1>Личный кабинет BluePulse</h1>
                <p>
                  Эта страница доступна только
                  авторизованным пользователям.
                </p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Неизвестные адреса */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
