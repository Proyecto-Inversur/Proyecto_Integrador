import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly, usersOnly }) => {
  const { currentEntity, loading, verifying } = useContext(AuthContext);
  const location = useLocation();

  if (loading || verifying) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!currentEntity) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && (currentEntity.type !== 'usuario' || currentEntity.data.rol !== 'Administrador')) {
    return <Navigate to="/" replace />;
  }

  if (usersOnly && currentEntity.type !== 'usuario') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
