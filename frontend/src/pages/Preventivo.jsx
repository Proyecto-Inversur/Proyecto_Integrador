import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FiArrowLeft } from 'react-icons/fi';
import { updateMantenimientoPreventivo, deleteMantenimientoPhoto, deleteMantenimientoPlanilla, getMantenimientoPreventivo } from '../services/mantenimientoPreventivoService';
import { getCuadrillas } from '../services/cuadrillaService';
import { getSucursales } from '../services/sucursalService';
import { selectPreventivo, deletePreventivo } from '../services/maps';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { FiSend, FiPlusCircle, FiCheckCircle } from "react-icons/fi";
import '../styles/mantenimientos.css';

const Preventivo = () => {
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const mantenimientoId = location.state?.mantenimientoId;
  const [mantenimiento, setMantenimiento] = useState({});
  const [cuadrillas, setCuadrillas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formData, setFormData] = useState({
    planillas: [],
    fotos: [],
    fecha_cierre: null,
    extendido: null,
  });
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [isSelectingPlanillas, setIsSelectingPlanillas] = useState(false);
  const [planillaPreviews, setPlanillaPreviews] = useState([]);
  const [fotoPreviews, setFotoPreviews] = useState([]);
  const [selectedPlanillas, setSelectedPlanillas] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const fetchMantenimiento = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientoPreventivo(mantenimientoId);
      setMantenimiento(response.data);
      setFormData({
        planillas: [],
        fotos: [],
        fecha_cierre: response.data.fecha_cierre?.split('T')[0] || null,
        extendido: response.data.extendido || null,
      });
    } catch (error) {
      console.error('Error fetching mantenimiento:', error);
      setError('Error al cargar los datos actualizados.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cuadrillasResponse, sucursalesResponse] = await Promise.all([
        getCuadrillas(),
        getSucursales(),
      ]);
      setCuadrillas(cuadrillasResponse.data);
      setSucursales(sucursalesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMantenimiento();
    fetchData();
  }, []);

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

    const handlePhotoSelect = (photo) => {
      setSelectedPhotos((prev) =>
        prev.includes(photo)
          ? prev.filter((p) => p !== photo)
          : [...prev, photo]
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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelectedPhotos = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e, overrideData = null) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const data = overrideData || formData;

    const formDataToSend = new FormData();
    data.planillas.forEach(file => formDataToSend.append('planillas', file));
    data.fotos.forEach(file => formDataToSend.append('fotos', file));
    if (data.fecha_cierre) {
      formDataToSend.append('fecha_cierre', data.fecha_cierre);
    }
    if (data.extendido) {
      formDataToSend.append('extendido', data.extendido);
    }

    try {
      await updateMantenimientoPreventivo(mantenimiento.id, formDataToSend);
      setSuccess('Archivos y datos actualizados correctamente.');
      setFormData({ planillas: [], fotos: [], fecha_cierre: '', extendido: '' });
      setPlanillaPreviews([]);
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
    const hasPlanilla = mantenimiento.planillas?.length > 0;
    const hasFoto = mantenimiento.fotos?.length > 0;

    if (!hasPlanilla || !hasFoto) {
      setError('Debe cargar al menos una planilla y una foto para marcar como finalizado.');
      return;
    }

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const updatedFormData = {
        ...formData,
        fecha_cierre: formattedDate,
      };
      await handleSubmit({ preventDefault: () => {} }, updatedFormData);
      // Falta mandar notificacion al encargado de mantenimiento
      setSuccess('Mantenimiento marcado como finalizado correctamente.');
    } catch (error) {
      console.error('Error marking as finished:', error);
      setError('Error al marcar como finalizado.');
    }
  };

  const toggleRoute = () => {
    if (isSelected) {
      setIsSelected(false);
      handleRemoveFromRoute();
    } else {
      setIsSelected(true);
      handleAddToRoute();
    }
  };

  const handleAddToRoute = () => {
    const seleccion = {"id_mantenimiento": mantenimiento.id, "id_sucursal": mantenimiento.id_sucursal};
    selectPreventivo(seleccion);
    setSuccess('Mantenimiento agregado a la ruta.');
  };

  const handleRemoveFromRoute = () => {
    deletePreventivo(mantenimiento.id);
    setSuccess('Mantenimiento eliminado de la ruta.');
  };

  const getSucursalNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.nombre : 'Desconocida';
  };

  const getCuadrillaNombre = (id_cuadrilla) => {
    const cuadrilla = cuadrillas.find((c) => c.id === id_cuadrilla);
    return cuadrilla ? cuadrilla.nombre : 'Desconocida';
  };

  const getZonaNombre = (id_sucursal) => {
    const sucursal = sucursales.find((s) => s.id === id_sucursal);
    return sucursal ? sucursal.zona : 'Desconocida';
  };

  function formatExtendido(fechaIso) {
    const date = new Date(fechaIso);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  return (
    <Container fluid className="mantenimiento-container">
      {isLoading ? (
        <div className="custom-div">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
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
                <strong className="info-label">Zona:</strong>{' '}
                {mantenimiento.id_sucursal ? getZonaNombre(mantenimiento.id_sucursal) : 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Fecha Apertura:</strong>{' '}
                {mantenimiento.fecha_apertura?.split('T')[0] || 'N/A'}
              </div>
              <div className="info-field">
                <strong className="info-label">Fecha Cierre:</strong>{' '}
                {mantenimiento.fecha_cierre?.split('T')[0] || 'Mantenimiento no finalizado'}
              </div>
              <div className="info-field">
                <strong className="info-label">Extendido:</strong>{' '}
                {mantenimiento.extendido
                  ? `${formatExtendido(mantenimiento.extendido)} hs`
                  : 'No hay extendido'}
              </div>
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
                <Button variant={isSelected ? 'danger' : 'success'} className="info-button-add" onClick={toggleRoute}>
                  <FiPlusCircle className="me-2" size={18} />{isSelected ? 'Borrar de la ruta' : 'Agregar a la ruta actual'}
                </Button>
              )}
              {currentEntity.type !== 'usuario' && (
                <Button variant="dark" className="info-button-finish" onClick={handleFinish}>
                  <FiCheckCircle className="me-2" size={18} />Marcar como finalizado
                </Button>
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
              <h4 className="planilla-section-title">Planillas</h4>
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
                  <div className="selected-files justify-content-center align-items-center mt-2">
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
                      <div className="photo-container">
                        <img
                          src={preview}
                          alt={`Nueva planilla ${index + 1}`}
                          className="gallery-thumbnail"
                          onClick={() => handleImageClick(preview)}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
              {mantenimiento.planillas?.length > 0 && (
              <div className="d-flex justify-content-end mt-3 gap-2">
                {!isSelectingPlanillas && (
                  <Button variant="outline-danger" onClick={() => setIsSelectingPlanillas(true)}>
                    Eliminar Planillas
                  </Button>
                )}
                {isSelectingPlanillas && selectedPlanillas.length > 0 && (
                  <Button variant="danger" onClick={handleDeleteSelectedPlanillas}>
                    Eliminar Planillas Seleccionadas
                  </Button>
                )}
                {isSelectingPlanillas && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsSelectingPlanillas(false);
                      setSelectedPlanillas([]);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            )}

            {mantenimiento.planillas?.length > 0 ? (
              <>
                <Row className="gallery-section mt-3">
                  {mantenimiento.planillas.map((planilla, index) => (
                    <Col md={3} key={index} className="gallery-item">
                      <div
                        className={`photo-container ${isSelectingPlanillas ? 'selectable' : ''}`}
                        onClick={() => {
                          if (isSelectingPlanillas) {
                            handlePlanillaSelect(planilla);
                          } else {
                            handleImageClick(planilla);
                          }
                        }}
                      >
                        <img
                          src={planilla}
                          alt={`Planilla ${index + 1}`}
                          className="gallery-thumbnail"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
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
                <div className="selected-files justify-content-center align-items-center mt-2">
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
                    <div className="photo-container">
                      <img
                        src={preview}
                        alt={`Nueva foto ${index + 1}`}
                        className="gallery-thumbnail"
                        onClick={() => handleImageClick(preview)}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            )}
            {mantenimiento.fotos?.length > 0 && (
              <div className="d-flex justify-content-center mt-3 gap-2">
                {!isSelectingPhotos && (
                  <Button variant="outline-danger" onClick={() => setIsSelectingPhotos(true)}>
                    Eliminar Fotos
                  </Button>
                )}
                {isSelectingPhotos && selectedPhotos.length > 0 && (
                  <Button variant="danger" onClick={handleDeleteSelectedPhotos}>
                    Eliminar Fotos Seleccionadas
                  </Button>
                )}
                {isSelectingPhotos && (
                  <Button variant="secondary" onClick={() => {
                    setIsSelectingPhotos(false);
                    setSelectedPhotos([]);
                  }}>
                    Cancelar
                  </Button>
                )}
              </div>
            )}

            {mantenimiento.fotos?.length > 0 ? (
              <>
                <Row className="gallery-section mt-3">
                  {mantenimiento.fotos.map((photo, index) => {
                    const isSelected = selectedPhotos.includes(photo);
                    return (
                      <Col md={3} key={index} className="gallery-item">
                        <div
                          className={`photo-container ${isSelectingPhotos ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (isSelectingPhotos) {
                              handlePhotoSelect(photo);
                            } else {
                              handleImageClick(photo);
                            }
                          }}
                        >
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="gallery-thumbnail"
                          />
                        </div>
                      </Col>
                    );
                  })}
                </Row>

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
      <button
        type="button"
        onClick={() => navigate('/mantenimientos-preventivos')}
        className="floating-back-btn"
      >
        <FiArrowLeft size={28} color="white" />
      </button>
    </Container>
  );
};

export default Preventivo;