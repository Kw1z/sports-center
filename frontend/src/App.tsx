import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { HomePage } from "./pages/home/ui/HomePage";
import { AboutPage } from "./pages/about/ui/AboutPage";
import { SchedulePage } from "./pages/schedule/ui/SchedulePage";
import { LoginPage } from "./pages/authorization/ui/LoginPage";
import { RegisterPage } from "./pages/authorization/ui/RegisterPage";
import { ProtectedRoute } from "./features/authorization/ui/ProtectedRoute";
import { BookingsPage } from "./pages/bookings/ui/BookingsPage";
import { CatalogPage } from "./pages/catalog/ui/CatalogPage";
import { TrainersPage } from "./pages/trainers/ui/TrainersPage";
import { AdminLayout } from "./pages/admin/ui/AdminLayout";
import { AdminOverviewPage } from "./pages/admin/ui/AdminOverviewPage";
import { AdminSessionsPage } from "./pages/admin/ui/AdminSessionsPage";
import { AdminCreateSessionPage } from "./pages/admin/ui/AdminCreateSessionPage";
import { AdminServicesPage } from "./pages/admin/ui/AdminServicesPage";
import { AdminStaffPage } from "./pages/admin/ui/AdminStaffPage";
import { AdminRoomsPage } from "./pages/admin/ui/AdminRoomsPage";
import { AdminBookingsPage } from "./pages/admin/ui/AdminBookingsPage";
import { AdminUsersPage } from "./pages/admin/ui/AdminUsersPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Главная страница */}
        <Route path="/" element={<HomePage />} />

        {/* Каталог услуг */}
        <Route path="/catalog" element={<CatalogPage />} />

        {/* О клубе */}
        <Route path="/about" element={<AboutPage />} />

        {/* Расписание занятий */}
        <Route path="/schedule" element={<SchedulePage />} />

        {/* Страница тренеров */}
        <Route path="/trainers" element={<TrainersPage />} />

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
                  Эта страница доступна только авторизованным пользователям.
                </p>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Панель администратора */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Обзор */}
          <Route index element={<AdminOverviewPage />} />

          {/* Сеансы и записи */}
          <Route path="sessions" element={<AdminSessionsPage />} />
          <Route path="sessions/new" element={<AdminCreateSessionPage />} />

          {/* Разделы без извлечённого макета — заглушки */}
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        {/* Неизвестные маршруты */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
