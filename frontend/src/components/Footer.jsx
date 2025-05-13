import React from 'react';
import { Container } from 'react-bootstrap';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer bg-dark text-white py-3">
      <Container>
        <p className="text-center mb-0">
          © {new Date().getFullYear()} Inversur App. Todos los derechos reservados.
        </p>
      </Container>
    </footer>
  );
};

export default Footer;