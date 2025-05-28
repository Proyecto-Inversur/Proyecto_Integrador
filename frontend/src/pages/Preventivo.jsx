import React, { useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import '../styles/preventivo.css';

const Preventivo = () => {
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const mantenimiento = location.state?.mantenimiento || {};

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    }
  }, [currentEntity, navigate]);

  return (
    <Container fluid className="preventivo-container">
      <div className="page-content">
        <Row className="main-row">
          {/* Info Section */}
          <Col className="info-section">
            <h4>Mantenimiento Preventivo</h4>
            <div className="info-field">
              <strong>Sucursal - Frecuencia:</strong> {mantenimiento.nombre_sucursal || 'N/A'} - {mantenimiento.frecuencia || 'N/A'}
            </div>
            <div className="info-field">
              <strong>Cuadrilla:</strong> {mantenimiento.id_cuadrilla ? getCuadrillaNombre(mantenimiento.id_cuadrilla) : 'N/A'}
            </div>
            <div className="info-field">
              <strong>Fecha Apertura:</strong> {mantenimiento.fecha_apertura?.split('T')[0] || 'N/A'}
            </div>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Extendido</Form.Label>
                <Form.Control type="date" placeholder="Extendido: Fecha-Hora" />
              </Form.Group>
            </Form>
            <Button variant="dark" className="w-100 mb-2">
              Agregar a la ruta actual
            </Button>
            <Button variant="secondary" className="w-100">
              Marcar como finalizado
            </Button>
          </Col>

          {/* Chat Section */}
          <Col className="chat-section">
            <div className="chat-box">
              <div className="chat-message received">
                <p>Mensaje</p>
                <span className="chat-info">info/hora/visto</span>
              </div>
              <div className="chat-message sent">
                <p>Mensaje</p>
                <span className="chat-info">info/hora/visto</span>
              </div>
              <div className="chat-message received">
                <p>Mensaje</p>
                <span className="chat-info">info/hora/visto</span>
              </div>
            </div>
            <div className="chat-input-form">
              <input type="text" placeholder="Escribe un mensaje..." className="form-control" />
              <Button variant="light" className="chat-send-btn">
                <i className="bi bi-send">enviar</i>
              </Button>
            </div>
          </Col>

          {/* Plantilla Section */}
          <Col className="plantilla-section">
            <h4>Plantilla</h4>
            <div className="plantilla-placeholder"></div>
            <Button variant="secondary" className="w-100 mt-2">
              Cargar/Editar
            </Button>
          </Col>
        </Row>

        {/* Photos Section */}
        <Row className="photos-section mt-4">
          <h4 className="photos-title">Fotos de la obra</h4>
          <Row className="grid-section">
            <Col md={3} className="grid-item"></Col>
            <Col md={3} className="grid-item"></Col>
            <Col md={3} className="grid-item"></Col>
            <Col md={3} className="grid-item"></Col>
          </Row>
          <div className="grid-actions text-center mt-2">
            <Button variant="secondary">Cargar/Eliminar</Button>
          </div>
        </Row>
      </div>
    </Container>
  );

  // Placeholder function to match your previous context
  function getCuadrillaNombre(id_cuadrilla) {
    // This should ideally use the cuadrillas state from MantenimientosPreventivos
    // For now, returning a dummy value or fetching logic can be added
    return 'Cuadrilla 1'; // Replace with actual logic if needed
  }
};

export default Preventivo;