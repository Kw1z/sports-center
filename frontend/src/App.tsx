
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import { HomePage } from "./pages/home/ui/HomePage";
import { AboutPage } from "./pages/about/ui/AboutPage";
import { SchedulePage } from "./pages/schedule/ui/SchedulePage";
import { LoginPage } from "./pages/authorization/ui/LoginPage";
import { RegisterPage } from "./pages/authorization/ui/RegisterPage";
import { ProtectedRoute } from "./features/authorization/ui/ProtectedRoute";
import { BookingsPage } from "./pages/bookings/ui/BookingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Главная страница */}
        <Route path="/" element={<HomePage />} />

        {/* О клубе */}
        <Route path="/about" element={<AboutPage />} />

        {/* Расписание занятий */}
        <Route path="/schedule" element={<SchedulePage />} />

        {/* Мои записи */}
        <Route path="/bookings" element={<BookingsPage />} />

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

        {/* Неизвестные маршруты */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
