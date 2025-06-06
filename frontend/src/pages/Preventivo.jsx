import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { updateMantenimientoPreventivo, deleteMantenimientoPhoto, deleteMantenimientoPlanilla } from '../services/mantenimientoPreventivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { FiSend, FiPlusCircle, FiCheckCircle } from "react-icons/fi";
import '../styles/preventivo.css';

const Preventivo = () => {
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const mantenimiento = location.state?.mantenimiento || {};
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [formData, setFormData] = useState({
    planillas: [],
    fotos: [],
    extendido: '',
  });
  const [planillaPreviews, setPlanillaPreviews] = useState([]);
  const [fotoPreviews, setFotoPreviews] = useState([]);
  const [selectedPlanillas, setSelectedPlanillas] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!currentEntity) {
      navigate('/login');
    } else {
      fetchSucursales();
      fetchCuadrillas();
    }
  }, [currentEntity, navigate]);

  const fetchSucursales = async () => {
    try {
      const response = await getSucursales();
      setSucursales(response.data);
    } catch (error) {
      console.error('Error fetching sucursales:', error);
    }
  };

  const fetchCuadrillas = async () => {
    try {
      const response = await getCuadrillas();
      setCuadrillas(response.data);
    } catch (error) {
      console.error('Error fetching cuadrillas:', error);
    }
  };

  const handleFileChange = (e, field) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, [field]: files });

    const previews = files.map(file => URL.createObjectURL(file));
    if (field === 'planillas') {
      setPlanillaPreviews(previews);
    } else if (field === 'fotos') {
      setFotoPreviews(previews);
    }
  };

  const handleExtendidoChange = (e) => {
    setFormData({ ...formData, extendido: e.target.value });
  };

  const handlePlanillaSelect = (planillaUrl) => {
    setSelectedPlanillas(prev =>
      prev.includes(planillaUrl)
        ? prev.filter(url => url !== planillaUrl)
        : [...prev, planillaUrl]
    );
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

  const handleDeleteSelectedPlanillas = async () => {
    try {
      for (const planillaUrl of selectedPlanillas) {
        const fileName = planillaUrl.split('/').pop();
        await deleteMantenimientoPlanilla(mantenimiento.id, fileName);
      }
      setSelectedPlanillas([]);
      setSuccess('Planillas eliminadas correctamente.');
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error deleting planillas:', error);
      setError('Error al eliminar las planillas.');
    }
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
    setError('');
    setSuccess('');

    const formDataToSend = new FormData();
    formData.planillas.forEach(file => formDataToSend.append('planillas', file));
    formData.fotos.forEach(file => formDataToSend.append('fotos', file));
    if (formData.extendido) {
      formDataToSend.append('extendido', new Date(formData.extendido).toISOString());
    }

    try {
      await updateMantenimientoPreventivo(mantenimiento.id, formDataToSend);
      setSuccess('Archivos y datos actualizados correctamente.');
      setFormData({ planillas: [], fotos: [], extendido: '' });
      setPlanillaPreviews([]);
      setFotoPreviews([]);
    } catch (error) {
      console.error('Error updating mantenimiento:', error);
      setError(error.response?.data?.detail || 'Error al actualizar los datos.');
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
    <Container fluid className="preventivo-container">
      <div className="page-content">
        <Row className="main-row">
          <Col className="info-section">
            <h4 className="info-section-title">Mantenimiento Preventivo</h4>
            <div className="info-field">
              <strong className="info-label">Sucursal - Frecuencia:</strong>{' '}
              {mantenimiento.id_sucursal ? getSucursalNombre(mantenimiento.id_sucursal) : 'N/A'} - {mantenimiento.frecuencia || 'N/A'}
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
              <strong className="info-label">Extendido:</strong>{' '}
              {mantenimiento.extendido?.split('T')[0] || 'N/A'}
            </div>
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
              <button 
                type="submit" 
                onClick={handleSubmit} 
                className="floating-save-btn"
              >
                ✔
              </button>
            </Form>
            <Button variant="secondary" className="info-button-add">
              <FiPlusCircle className="me-2" size={18} />Agregar a la ruta actual
            </Button>
            <Button variant="dark" className="info-button-finish">
              <FiCheckCircle className="me-2" size={18} />Marcar como finalizado
            </Button>
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
                multiple
                accept="image/*"
                id="planillaUpload"
                style={{ display: 'none' }} // Ocultamos el input de archivo
                onChange={(e) => handleFileChange(e, 'planillas')}
              />
              <Button
                variant="primary"
                onClick={() => document.getElementById('planillaUpload').click()} // Simulamos clic en el input oculto
              >
                Cargar Planillas
              </Button>
              {/* Mostrar nombres de archivos seleccionados */}
              {formData.planillas.length > 0 && (
                <div className="selected-files mt-2">
                  <strong>Archivos seleccionados:</strong>
                  <ul>
                    {formData.planillas.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Form.Group>
            {planillaPreviews.length > 0 && (
              <Row className="gallery-section mt-3">
                {planillaPreviews.map((preview, index) => (
                  <Col md={3} key={index} className="gallery-item">
                    <img
                      src={preview}
                      alt={`Nueva planilla ${index + 1}`}
                      className="gallery-thumbnail"
                      onClick={() => handleImageClick(preview)}
                    />
                  </Col>
                ))}
              </Row>
            )}
            {mantenimiento.planillas?.length > 0 ? (
              <>
                <Row className="gallery-section mt-3">
                  {mantenimiento.planillas.map((planilla, index) => (
                    <Col md={3} key={index} className="gallery-item">
                      <div
                        className={`photo-container ${selectedPlanillas.includes(planilla) ? 'selected' : ''}`}
                        onClick={() => handlePlanillaSelect(planilla)}
                      >
                        <img
                          src={planilla}
                          alt={`Planilla ${index + 1}`}
                          className="gallery-thumbnail"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(planilla);
                          }}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
                {/* Botón de eliminación siempre visible */}
                <div className="d-flex justify-content-end mt-5">
                  <Button variant="danger">
                    Eliminar Planillas Seleccionadas
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3">No hay planillas cargadas.</p>
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
    </Container>
  );
};

export default Preventivo;