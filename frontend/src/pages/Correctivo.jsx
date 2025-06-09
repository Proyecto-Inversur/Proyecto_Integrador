import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { updateMantenimientoCorrectivo, deleteMantenimientoPhoto, getMantenimientoCorrectivo } from '../services/mantenimientoCorrectivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { FiSend, FiPlusCircle, FiCheckCircle } from "react-icons/fi";
import '../styles/mantenimientos.css';

const Correctivo = () => {
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const mantenimiento = location.state?.mantenimiento || {};
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [formData, setFormData] = useState({
    planilla: '',
    fotos: [],
    extendido: '',
    estado: '',
  });
  const [planillaPreview, setPlanillaPreview] = useState('');
  const [fotoPreviews, setFotoPreviews] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlanilla, setSelectedPlanilla] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchMantenimiento = async () => {
  try {
    const response = await getMantenimientoCorrectivo(mantenimiento.id);
    setFormData({
      planilla: '',
      fotos: [],
      extendido: response.data.extendido?.split('T')[0] || '',
      estado: response.data.estado,
    });
    navigate(location.pathname, { state: { mantenimiento: response.data } });
  } catch (error) {
    console.error('Error fetching mantenimiento:', error);
    setError('Error al cargar los datos actualizados.');
  }
};

  const fetchData = async () => {
    try {
      const [sucursalesResponse, cuadrillasResponse] = await Promise.all([
        getSucursales(),
        getCuadrillas(),
      ]);
      setSucursales(sucursalesResponse.data);
      setCuadrillas(cuadrillasResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    } else {
      fetchMantenimiento();
      fetchData();
    }
  }, [currentEntity, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, field) => {
    if (field === 'planilla') {
      const file = e.target.files[0];
      if (file) {
        setFormData({ ...formData, [field]: file });
        setPlanillaPreview(URL.createObjectURL(file));
      }
    } else if (field === 'fotos') {
      const files = Array.from(e.target.files);
      setFormData({ ...formData, [field]: files });
      const previews = files.map(file => URL.createObjectURL(file));
      setFotoPreviews(previews);
    }
  };

  const handleExtendidoChange = (e) => {
    setFormData({ ...formData, extendido: e.target.value });
  };

  const handlePlanillaSelect = (planillaUrl) => {
    setSelectedPlanilla(planillaUrl);
  };

  const handlePhotoSelect = (photoUrl) => {
    setSelectedPhotos(prev =>
      prev.includes(photoUrl)
        ? prev.filter(url => url !== photoUrl)
        : [...prev, photoUrl]
    );
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const handleDeleteSelectedPhotos = async () => {
    try {
      for (const photoUrl of selectedPhotos) {
        const fileName = photoUrl.split('/').pop();
        await deleteMantenimientoPhoto(mantenimiento.id, fileName);
      }
      setSelectedPhotos([]);
      setSuccess('Fotos eliminadas correctamente.');
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error deleting photos:', error);
      setError('Error al eliminar las fotos.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formDataToSend = new FormData();
    if (formData.planilla) {
      formDataToSend.append('planilla', formData.planilla);
    }
    formData.fotos.forEach(file => formDataToSend.append('fotos', file));
    if (formData.extendido) {
      formDataToSend.append('extendido', formData.extendido);
    }
    if (formData.estado) {
      formDataToSend.append('estado', formData.estado);
    }

    try {
      await updateMantenimientoCorrectivo(mantenimiento.id, formDataToSend);
      setSuccess('Archivos y datos actualizados correctamente.');
      setFormData({ planilla: '', fotos: [], extendido: '', estado: '' });
      setPlanillaPreview('');
      setFotoPreviews([]);
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error updating mantenimiento:', error);
      setError(error.response?.data?.detail || 'Error al actualizar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    const hasPlanilla = mantenimiento.planilla !== '';
    const hasFoto = mantenimiento.fotos?.length > 0;

    if (!hasPlanilla || !hasFoto) {
      setError('Debe cargar al menos una planilla y una foto para marcar como finalizado.');
      return;
    }

    try {
      setFormData({ ...formData, estado: 'Solucionado' });
      await handleSubmit({ preventDefault: () => {} });
      // Falta mandar notificacion al encargado de mantenimiento
      setSuccess('Mantenimiento marcado como finalizado correctamente.');
    } catch (error) {
      console.error('Error marking as finished:', error);
      setError('Error al marcar como finalizado.');
    }
  };

  const getSucursalNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.nombre : 'Desconocida';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'Desconocida';
  };

  return (
    <Container fluid className="mantenimiento-container">
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="page-content">
          <Row className="main-row">
            <Col className="info-section">
              <h4 className="info-section-title">Mantenimiento Correctivo</h4>
              <div className="info-field">
                <strong className="info-label">Sucursal:</strong>{' '}
                {mantenimiento.id_sucursal ? getSucursalNombre(mantenimiento.id_sucursal) : 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Cuadrilla:</strong>{' '}
                {mantenimiento.id_cuadrilla ? getCuadrillaNombre(mantenimiento.id_cuadrilla) : 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Fecha Apertura:</strong>{' '}
                {mantenimiento.fecha_apertura?.split('T')[0] || 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Numero de Caso:</strong>{' '}
                {mantenimiento.numero_caso}
              </div>
              <div className="info-field">
                <strong className="info-label">Incidente:</strong>{' '}
                {mantenimiento.incidente}
              </div>
              <div className="info-field">
                <strong className="info-label">Rubro:</strong>{' '}
                {mantenimiento.rubro}
              </div>
              <div className="info-field">
                <strong className="info-label">Prioridad:</strong>{' '}
                {mantenimiento.prioridad}
              </div>
              {currentEntity.type === 'usuario' && (
                <div className="info-field">
                  <strong className="info-label">Extendido:</strong>{' '}
                  {mantenimiento.extendido
                    ? new Date(mantenimiento.extendido).toLocaleString('es-AR', {
                        hour12: false,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'No hay extendido'}
                  {mantenimiento.extendido ? ' hs' : ''}
                </div>
              )}
              {currentEntity.type !== 'usuario' && (
                <Form className="info-form" onSubmit={handleSubmit}>
                  <Form.Group className="extendido-row">
                    <Form.Label className="extendido-label">Extendido:</Form.Label>
                    <Form.Control 
                      type="datetime-local" 
                      name="extendido"
                      value={formData.extendido}
                      onChange={handleExtendidoChange}
                      placeholder="Seleccionar fecha" 
                      className="extendido-input" />
                  </Form.Group>
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                </Form>
              )}
              {currentEntity.type !== 'usuario' && (
                <Button variant="secondary" className="info-button-add">
                  <FiPlusCircle className="me-2" size={18} />Agregar a la ruta actual
                </Button>
              )}
              {currentEntity.type !== 'usuario' && (
                <Button variant="dark" className="info-button-finish" onClick={handleFinish}>
                  <FiCheckCircle className="me-2" size={18} />Marcar como finalizado
                </Button>
              )}
              {currentEntity.type === 'usuario' && (
                <Form className="info-form" onSubmit={handleSubmit}>
                  <Form.Group className="extendido-row" controlId="estado">
                    <Form.Label className="extendido-label">Estado</Form.Label>
                    <Form.Select
                      name="estado"
                      value={formData.estado || ''}
                      onChange={handleChange}
                      className='form-select'
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Progreso">En Progreso</option>
                      <option value="Finalizado">Finalizado</option>
                      <option value="A Presupuestar">A Presupuestar</option>
                      <option value="Presupuestado">Presupuestado</option>
                      <option value="Presupuesto Aprobado">Presupuesto Aprobado</option>
                      <option value="Esperando Respuesta Bancor">Esperando Respuesta Bancor</option>
                      <option value="Aplazado">Aplazado</option>
                      <option value="Desestimado">Desestimado</option>
                      <option value="Solucionado">Solucionado</option>
                    </Form.Select>
                  </Form.Group>
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                </Form>
              )}
              <button 
                type="submit" 
                onClick={handleSubmit} 
                className="floating-save-btn"
              >
                ✔
              </button>
            </Col>

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
              </div>
              <div className="chat-input-form">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  className="chat-input"
                />
                <Button variant="light" className="chat-send-btn">
                  <FiSend size={20} color="black" />
                </Button>
              </div>
            </Col>

            <Col className="planilla-section">
              <h4 className="planilla-section-title">Planilla</h4>
              <Form.Group>
                <input
                  type="file"
                  accept="image/*"
                  id="planillaUpload"
                  style={{ display: 'none' }} // Ocultamos el input de archivo
                  onChange={(e) => handleFileChange(e, 'planilla')}
                />
                <Button
                  variant="primary"
                  onClick={() => document.getElementById('planillaUpload').click()} // Simulamos clic en el input oculto
                >
                  Cargar Planilla
                </Button>
                {/* Mostrar nombres de archivos seleccionados */}
                {formData.planilla && (
                  <div className="selected-files mt-2">
                    <strong>Archivo seleccionado:</strong>
                    <ul>
                      <li>{formData.planilla.name}</li>
                    </ul>
                  </div>
                )}
              </Form.Group>
              {planillaPreview && (
                <Row className="gallery-section mt-3">
                  <Col md={3} className="gallery-item">
                    <img
                      src={planillaPreview}
                      className="gallery-thumbnail"
                      onClick={() => handleImageClick(planillaPreview)}
                    />
                  </Col>
                </Row>
              )}
              {mantenimiento.planilla ? (
                <>
                  <Row className="gallery-section mt-3">
                    <Col md={3} className="gallery-item">
                      <div
                        className={`photo-container ${selectedPlanilla === mantenimiento.planilla ? 'selected' : ''}`}
                        onClick={() => handlePlanillaSelect(mantenimiento.planilla)}
                      >
                        <img
                          src={mantenimiento.planilla}
                          className="gallery-thumbnail"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(mantenimiento.planilla);
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                  {/* Botón de eliminación siempre visible */}
                  <div className="d-flex justify-content-end mt-5">
                    <Button variant="danger">
                      Eliminar Planilla Seleccionada
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-3">No hay planilla cargada.</p>
              )}
            </Col>
          </Row>

          <Row className="photos-section mt-5"> 
            <h4 className="photos-title">Fotos de la obra</h4>
            <Form.Group className="text-center"> {/* Añadido text-center para centrar */}
              <input
                type="file"
                multiple
                accept="image/*"
                id="fotoUpload"
                style={{ display: 'none' }} // Ocultamos el input de archivo
                onChange={(e) => handleFileChange(e, 'fotos')}
              />
              <Button
                variant="primary"
                onClick={() => document.getElementById('fotoUpload').click()} // Simulamos clic en el input oculto
              >
                Cargar Fotos
              </Button>
              {/* Mostrar nombres de archivos seleccionados */}
              {formData.fotos.length > 0 && (
                <div className="selected-files mt-2">
                  <strong>Archivos seleccionados:</strong>
                  <ul>
                    {formData.fotos.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Form.Group>
            {fotoPreviews.length > 0 && (
              <Row className="gallery-section mt-3">
                {fotoPreviews.map((preview, index) => (
                  <Col md={3} key={index} className="gallery-item">
                    <img
                      src={preview}
                      alt={`Nueva foto ${index + 1}`}
                      className="gallery-thumbnail"
                      onClick={() => handleImageClick(preview)}
                    />
                  </Col>
                ))}
              </Row>
            )}
            {mantenimiento.fotos?.length > 0 ? (
              <>
                <Row className="gallery-section mt-3">
                  {mantenimiento.fotos.map((photo, index) => (
                    <Col md={3} key={index} className="gallery-item">
                      <div
                        className={`photo-container ${selectedPhotos.includes(photo) ? 'selected' : ''}`}
                        onClick={() => handlePhotoSelect(photo)}
                      >
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="gallery-thumbnail"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(photo);
                          }}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
                {/* Botón de eliminación siempre visible */}
                <div className="d-flex justify-content-center mt-5">
                  <Button variant="danger">
                    Eliminar Fotos Seleccionadas
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3">No hay fotos cargadas.</p>
            )}
          </Row>

          <Modal show={showModal} onHide={handleCloseModal} centered>
            <Modal.Body>
              {selectedImage && (
                <img src={selectedImage} alt="Full size" className="img-fluid" />
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      )}
    </Container>
  );
};

export default Correctivo;