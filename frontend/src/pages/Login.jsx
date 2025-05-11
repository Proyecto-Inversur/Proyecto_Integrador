import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { auth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from '../services/firebase';
import { FcGoogle } from 'react-icons/fc';
import '../styles/login.css';
import logoInversur from '../assets/logo_inversur.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, contrasena);
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', idToken);
      setError(null);
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', idToken);
      setError(null);
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
    }
  };

  return (
    <div className="main-bg">
      <div className="login-container text-c animated flipInX">
        <div>
          <img src={logoInversur} alt="Inversur Logo" className="logo" />
        </div>
        <div className="container-content">
          {error && <Alert variant="danger">{error}</Alert>}
          <Form className="margin-t" onSubmit={handleSubmit}>
            <Form.Group className="form-group">
              <Form.Control
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Control
                type="password"
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" className="form-button button-l margin-b custom-login-btn">
              Iniciar Sesión
            </Button>
          </Form>
          <Button
            className="form-button button-l margin-b d-flex align-items-center justify-content-center gap-2 custom-login-btn"
            onClick={handleGoogleSignIn}
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