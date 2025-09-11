import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BackButton from './BackButton';
import routes from '../routes';

const Layout = () => {
  const location = useLocation();
  const currentRoute = routes.find((r) => r.path === location.pathname);
  const showBackButton = !(currentRoute && currentRoute.hideBackButton);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        {showBackButton && <BackButton />}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
