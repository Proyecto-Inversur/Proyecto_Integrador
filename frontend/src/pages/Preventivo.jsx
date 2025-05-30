import React, { useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import '../styles/preventivo.css'; // Importa los estilos específicos para esta página

// Componente Preventivo para gestionar mantenimientos preventivos
const Preventivo = () => {
  // Obtiene el estado de autenticación del contexto
  const { currentEntity } = useContext(AuthContext);
  // Hook para navegar entre rutas
  const navigate = useNavigate();
  // Obtiene los datos pasados a través del estado de la ubicación
  const location = useLocation();
  const mantenimiento = location.state?.mantenimiento || {}; // Datos del mantenimiento, por defecto un objeto vacío si no hay estado

  // Efecto para redirigir a login si no hay usuario autenticado
  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    }
  }, [currentEntity, navigate]);

  // Función placeholder para obtener el nombre de una cuadrilla (debe reemplazarse con lógica real)
  function getCuadrillaNombre(id_cuadrilla) {
    // Nota: Esto debería usar un estado o servicio real para obtener el nombre de la cuadrilla
    // Por ahora, retorna un valor dummy
    return 'Cuadrilla 1'; // Reemplazar con lógica de fetching si es necesario
  }

  return (
    <Container fluid className="preventivo-container">
      <div className="page-content">
        {/* Fila principal que contiene las secciones de información, chat y planilla */}
        <Row className="main-row">
          {/* Sección de información del mantenimiento preventivo */}
          <Col className="info-section">
            <h4 className="info-section-title">Mantenimiento Preventivo</h4>
            <div className="info-field">
              <strong className="info-label">Sucursal - Frecuencia:</strong>{' '}
              {mantenimiento.nombre_sucursal || 'N/A'} - {mantenimiento.frecuencia || 'N/A'}
            </div>
            <div className="info-field">
              <strong className="info-label">Cuadrilla:</strong>{' '}
              {mantenimiento.id_cuadrilla ? getCuadrillaNombre(mantenimiento.id_cuadrilla) : 'N/A'}
            </div>
            <div className="info-field">
              <strong className="info-label">Fecha Apertura:</strong>{' '}
              {mantenimiento.fecha_apertura?.split('T')[0] || 'N/A'}
            </div>
            <Form className="info-form">
              <Form.Group className="info-form-group">
                <Form.Label className="info-form-label">Extendido</Form.Label>
                <Form.Control type="date" placeholder="Extendido: Fecha-Hora" className="info-form-control" />
              </Form.Group>
            </Form>
            <Button variant="dark" className="info-button-add">
              Agregar a la ruta actual
            </Button>
            <Button variant="secondary" className="info-button-finish">
              Marcar como finalizado
            </Button>
          </Col>

          {/* Sección de chat para comunicación */}
          <Col className="chat-section">
            <div className="chat-box">
              <div className="chat-message chat-message-received">
                <p className="chat-message-text">Mensaje</p>
                <span className="chat-info">info/hora/visto</span>
              </div>
              <div className="chat-message chat-message-sent">
                <p className="chat-message-text">Mensaje</p>
                <span className="chat-info">info/hora/visto</span>
              </div>
              <div className="chat-message chat-message-received">
                <p className="chat-message-text">Mensaje</p>
                <span className="chat-info">info/hora/visto</span>
              </div>
            </div>
            <div className="chat-input-form">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="chat-input"
              />
              <Button variant="light" className="chat-send-btn">
                <i className="bi bi-send">enviar</i>
              </Button>
            </div>
          </Col>

          {/* Sección de planilla para cargar documentos */}
          <Col className="planilla-section">
            <h4 className="planilla-section-title">Planilla</h4>
            <div className="planilla-placeholder"></div>
            <Button variant="secondary" className="planilla-button">
              Cargar/Editar
            </Button>
          </Col>
        </Row>

        {/* Sección de fotos de la obra */}
        <Row className="photos-section">
          <h4 className="photos-title">Fotos de la obra</h4>
          <Row className="grid-section">
            <Col md={3} className="grid-item"></Col>
            <Col md={3} className="grid-item"></Col>
            <Col md={3} className="grid-item"></Col>
            <Col md={3} className="grid-item"></Col>
          </Row>
          <div className="grid-actions">
            <Button variant="secondary" className="grid-actions-button">
              Cargar/Eliminar
            </Button>
          </div>
        </Row>
      </div>
    </Container>
  );
};

export default Preventivo;