import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import CollectionView from './pages/CollectionView';
import MobileCollections from './pages/MobileCollections';
import TagsView from './pages/TagsView';
import TagDetailView from './pages/TagDetailView';
import NotFound from './pages/NotFound';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <Toast />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/library" element={<Home />} />
                <Route path="/tags" element={<TagsView />} />
                <Route path="/tags/:tag" element={<TagDetailView />} />
                <Route path="/collections" element={<MobileCollections />} />
                <Route path="/collections/:name" element={<CollectionView />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;