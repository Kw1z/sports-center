
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { HomePage } from "./pages/home/ui/HomePage";
import { LoginPage } from "./pages/authorization/ui/LoginPage";
import { RegisterPage } from "./pages/authorization/ui/RegisterPage";
import { ProtectedRoute } from "./features/authorization/ui/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Главная страница доступна всем */}
        <Route path="/" element={<HomePage />} />

        {/* Страницы авторизации */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Защищённая страница */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div style={{ padding: 40 }}>
                <h1>Личный кабинет BluePulse</h1>
                <p>Эта страница доступна только авторизованным пользователям.</p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Неизвестные адреса перенаправляем на главную */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
