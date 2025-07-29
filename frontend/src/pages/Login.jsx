import { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import '../styles/login.css';
import logoInversur from '../assets/logo_inversur.png';

const Login = () => {
  const [error, setError] = useState(null);
  const location = useLocation();
  const { verifying, logOut, signInWithGoogle } = useContext(AuthContext);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Error en inicio de sesión con Google:", err);
      setError(err.message || 'Error al iniciar sesión con Google');
      await logOut(err.message);
    }
  };

  if (verifying) {
    return (
      <div className="main-bg">
        <div className="login-container text-c animated flipInX">
          <div>
            <img src={logoInversur} alt="Inversur Logo" className="logo" />
          </div>
          <div className="container-content d-flex justify-content-center align-items-center min-vh-50">
            <Spinner animation="border" role="status" style={{ color: 'white' }}>
              <span className="visually-hidden">Verificando...</span>
            </Spinner>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-bg">
      <div className="login-container text-c animated flipInX">
        <div>
          <img src={logoInversur} alt="Inversur Logo" className="logo" />
        </div>
        <div className="container-content">
          {(error || location.state?.error) && (
            <Alert variant="danger">{error || location.state.error}</Alert>
          )}
          <Button
            className="form-button button-l margin-b d-flex align-items-center justify-content-center gap-2 custom-login-btn"
            onClick={handleGoogleSignIn}
            disabled={verifying}
          >
            <FcGoogle size={20} />
            Iniciar Sesión con Google
          </Button>
          <p className="margin-t text-whitesmoke">
            <small>Inversur © 2025</small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;