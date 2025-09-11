import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useAuthRoles } from '../hooks/useAuthRoles';

const ProtectedRoute = ({ children, adminOnly, usersOnly }) => {
  const { loading, verifying } = useContext(AuthContext);
  const { id, isUser, isAdmin } = useAuthRoles();
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

  if (!id) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (usersOnly && !isUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
