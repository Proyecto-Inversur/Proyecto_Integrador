import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LocationProvider from './context/LocationContext';
import Login from './pages/Login';
import { config } from './config';
import { LoadScript } from '@react-google-maps/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import routes from './routes';

const googleMapsLibraries = ['places'];
const isCypressRuntime = typeof window !== 'undefined' && !!window.Cypress;

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentEntity, loading, verifying } = useContext(AuthContext);

  useEffect(() => {
    if (currentEntity && !loading && !verifying && location.pathname === '/login') {
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [currentEntity, loading, verifying, location, navigate]);

  const shouldLoadMaps = Boolean(config.mapsApiKey) && !isCypressRuntime;

  const routesContent = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {routes.map(({ path, element, adminOnly, usersOnly }) => (
          <Route
            key={path}
            path={path}
            element={
              adminOnly || usersOnly ? (
                <ProtectedRoute adminOnly={adminOnly} usersOnly={usersOnly}>
                  {element}
                </ProtectedRoute>
              ) : (
                element
              )
            }
          />
        ))}
      </Route>
    </Routes>
  );

  return shouldLoadMaps ? (
    <LoadScript googleMapsApiKey={config.mapsApiKey} libraries={googleMapsLibraries}>
      {routesContent}
    </LoadScript>
  ) : (
    routesContent
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
