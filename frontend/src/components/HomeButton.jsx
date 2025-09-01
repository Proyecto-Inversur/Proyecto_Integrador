import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthRoles } from '../hooks/useAuthRoles';

const HomeButton = ({ to, icon: Icon, children, requiredRoles = [] }) => {
  const { isAdmin, isUser, isCuadrilla } = useAuthRoles();
  const roles = {
    admin: isAdmin,
    user: isUser,
    cuadrilla: isCuadrilla,
  };

  const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const hasPermission = allowed.length === 0 ? true : allowed.some(role => roles[role]);
  if (!hasPermission) return null;

  return (
    <Link to={to} className="home-button">
      <Icon />
      {children}
    </Link>
  );
};

export default HomeButton;
