import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Users from './pages/Users';
import Sucursales from './pages/Sucursales';
import Cuadrillas from './pages/Cuadrillas';
import Mantenimiento from './pages/Mantenimiento';
import Login from './pages/Login';
import 'bootstrap/dist/css/bootstrap.min.css';

const ProtectedRoute = ({ children, adminOnly, usersOnly }) => {
  const { currentEntity, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!currentEntity) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (currentEntity.type !== 'usuario' || currentEntity.data.rol !== 'Administrador')) {
    return <Navigate to="/" replace />;
  }

  if (usersOnly && currentEntity.type !== 'usuario') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentEntity, loading } = useContext(AuthContext);
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    if (currentEntity && !loading && isLoginPage) {
      navigate('/', { replace: true });
    }
  }, [currentEntity, loading, isLoginPage, navigate]);

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isLoginPage && <Navbar />}
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/mantenimiento" element={<ProtectedRoute><Mantenimiento /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="/sucursales" element={<ProtectedRoute usersOnly><Sucursales /></ProtectedRoute>} />
          <Route path="/cuadrillas" element={<ProtectedRoute usersOnly><Cuadrillas /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;