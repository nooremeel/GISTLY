import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <Toast />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              {/* Task 3: every authenticated route now renders inside the
                  header + sidebar shell instead of Home.jsx being the
                  entire page. Login/Register stay outside AppShell — they
                  get their own dedicated treatment in Task 19. */}
              <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;