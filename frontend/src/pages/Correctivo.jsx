import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { FiArrowLeft } from 'react-icons/fi';
import { BsUpload, BsTrashFill, BsPencilFill, BsX } from 'react-icons/bs';
import { updateMantenimientoCorrectivo, deleteMantenimientoPhoto, deleteMantenimientoPlanilla, getMantenimientoCorrectivo } from '../services/mantenimientoCorrectivoService';
import { getSucursales } from '../services/sucursalService';
import { getCuadrillas } from '../services/cuadrillaService';
import { selectCorrectivo, deleteCorrectivo } from '../services/maps';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { FiSend, FiPlusCircle, FiCheckCircle } from "react-icons/fi";
import { BsSave } from 'react-icons/bs';
import { getChatCorrectivo, sendMessageCorrectivo } from '../services/chats';
import '../styles/mantenimientos.css';

const Correctivo = () => {
  const { currentEntity } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const mantenimientoId = location.state?.mantenimientoId;
  const [mantenimiento, setMantenimiento] = useState({});
  const [sucursales, setSucursales] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [formData, setFormData] = useState({
    planilla: '',
    fotos: [],
    fecha_cierre: '',
    extendido: '',
    estado: '',
  });
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [isSelectingPlanilla, setIsSelectingPlanilla] = useState(false);
  const [planillaPreview, setPlanillaPreview] = useState('');
  const [fotoPreviews, setFotoPreviews] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlanilla, setSelectedPlanilla] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);
  const chatBoxRef = React.useRef(null);

  const fetchMantenimiento = async () => {
    setIsLoading(true);
    try {
      const response = await getMantenimientoCorrectivo(mantenimientoId);
      setMantenimiento(response.data);
      setFormData({
        planilla: '',
        fotos: [],
        fecha_cierre: response.data.fecha_cierre?.split('T')[0] || '',
        extendido: response.data.extendido || '',
        estado: response.data.estado,
      });
      await cargarMensajes(response.data.id);
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
      const [sucursalesResponse, cuadrillasResponse] = await Promise.all([
        getSucursales(),
        getCuadrillas(),
      ]);
      setSucursales(sucursalesResponse.data);
      setCuadrillas(cuadrillasResponse.data);
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

  useEffect(() => {
    const interval = setInterval(() => {
      cargarMensajes(mantenimiento.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [mantenimiento.id]);

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
    setSelectedPlanilla(prev =>
      prev === planillaUrl ? null : planillaUrl
    );
  };

  const handleDeleteSelectedPlanilla = async () => {
    setIsLoading(true);
    try {
      if (!selectedPlanilla) return;

      const fileName = selectedPlanilla.split('/').pop();
      await deleteMantenimientoPlanilla(mantenimiento.id, fileName);

      setSelectedPlanilla(null);
      setIsSelectingPlanilla(false);
      setSuccess('Planilla eliminada correctamente.');
      await fetchMantenimiento(); // Refresca los datos
    } catch (error) {
      console.error('Error al eliminar la planilla:', error);
      setError('Error al eliminar la planilla.');
    } finally {
      setIsLoading(false);
    }
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
    if (data.planilla) {
      formDataToSend.append('planilla', data.planilla);
    }
    data.fotos.forEach(file => formDataToSend.append('fotos', file));
    if (data.fecha_cierre) {
      formDataToSend.append('fecha_cierre', data.fecha_cierre);
    }
    if (data.extendido) {
      formDataToSend.append('extendido', data.extendido);
    }
    if (data.estado) {
      formDataToSend.append('estado', data.estado);
    }

    try {
      await updateMantenimientoCorrectivo(mantenimiento.id, formDataToSend);
      setSuccess('Archivos y datos actualizados correctamente.');
      setFormData({ planilla: '', fotos: [], fecha_cierre: '', extendido: '', estado: '' });
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
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const updatedFormData = {
        ...formData,
        fecha_cierre: formattedDate,
        estado: 'Solucionado',
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
    selectCorrectivo(seleccion);
    setSuccess('Mantenimiento agregado a la ruta.');
  };

  const handleRemoveFromRoute = () => {
    deleteCorrectivo(mantenimiento.id);
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

  const cargarMensajes = async (id) => {
    try {
      const response = await getChatCorrectivo(id);
      setMensajes(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje && !archivoAdjunto) return;

    const message = new FormData();
    message.append('firebase_uid', currentEntity.data.uid);
    message.append('nombre_usuario', currentEntity.data.nombre);
    if (nuevoMensaje) message.append('texto', nuevoMensaje);
    if (archivoAdjunto) message.append('archivo', archivoAdjunto);

    try {
      await sendMessageCorrectivo(mantenimiento.id, message);
      setNuevoMensaje('');
      setArchivoAdjunto(null);
      await cargarMensajes(mantenimiento.id);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setError('No se pudo enviar el mensaje');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
  };

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
                <strong className="info-label">Zona:</strong>{' '}
                {mantenimiento.id_sucursal ? getZonaNombre(mantenimiento.id_sucursal) : 'N/A'}
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
              <div className="info-field">
                <strong className="info-label">Estado:</strong>{' '}
                {mantenimiento.estado}
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
                className="floating-save-btn d-flex align-items-center justify-content-center"
                onClick={handleSubmit}
                title="Guardar cambios"
              >
                <BsSave size={28} />
              </button>
            </Col>

            <Col className="chat-section">
              <div className="chat-box" ref={chatBoxRef}>
                {mensajes.map((msg, index) => {
                  const esPropio = msg.firebase_uid === currentEntity.data.uid;
                  const esImagen = msg.archivo?.match(/\.(jpeg|jpg|png|gif)$/i);
                  return (
                    <div key={index} className={`chat-message ${esPropio ? 'chat-message-sent' : 'chat-message-received'}`}>
                      {msg.texto && <p className="chat-message-text">{msg.texto}</p>}
                      {msg.archivo && (
                        esImagen ? (
                          <img src={msg.archivo} alt="Adjunto" className="chat-image-preview" />
                        ) : (
                          <a href={msg.archivo} target="_blank" rel="noopener noreferrer" className="chat-file-link">
                            Archivo adjunto
                          </a>
                        )
                      )}
                      <span className="chat-info">
                        {msg.nombre_usuario} · {new Date(msg.fecha).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="chat-input-form">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  className="chat-input"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                />
                <input
                  type="file"
                  onChange={(e) => setArchivoAdjunto(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="archivoAdjunto"
                />
                <label htmlFor="archivoAdjunto" className="chat-attach-btn">
                  📎
                </label>
                <Button variant="light" className="chat-send-btn" onClick={handleEnviarMensaje}>
                  <FiSend size={20} color="black" />
                </Button>
              </div>
            </Col>

            <Col xs={12} md={4} className="planilla-section">
              <h4 className="planilla-section-title">Planilla</h4>
            <Form.Group>
              <input
                type="file"
                accept="image/*"
                id="planillaUpload"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'planilla')}
              />
              <div className="d-flex justify-content-center mb-2">
              <Button
                variant="warning"
                className="d-flex align-items-center gap-2"
                onClick={() => document.getElementById('planillaUpload').click()}
              >
                <BsUpload />
                Cargar
              </Button>
              </div>
              {/* Mostrar archivo recién seleccionado */}
              {formData.planilla && (
                <div className="selected-files mt-2">
                  <strong>Archivo seleccionado:</strong>
                  <ul>
                    <li>{formData.planilla.name}</li>
                  </ul>
                </div>
              )}
            </Form.Group>

            {/* Mostrar preview si se subió una nueva planilla */}
            {planillaPreview && (
              <Row className="gallery-section mt-3">
                <Col md={3} className="gallery-item">
                  <div className="photo-container">
                    <img
                      src={planillaPreview}
                      alt="Nueva planilla"
                      className="gallery-thumbnail"
                      onClick={() => handleImageClick(planillaPreview)}
                    />
                  </div>
                </Col>
              </Row>
            )}

            {/* Mostrar botones si hay planilla persistida */}
            {mantenimiento.planilla && (
              <div className="d-flex justify-content-center gap-2 mt-2">
                {isSelectingPlanilla ? (
                  <>
                    <Button className="icon-button" variant="danger" onClick={handleDeleteSelectedPlanilla}>
                      <BsTrashFill />
                    </Button>
                    <Button
                      className="icon-button"
                      variant="secondary"
                      onClick={() => {
                        setIsSelectingPlanilla(false);
                        setSelectedPlanilla(null);
                      }}
                    >
                      <BsX />
                    </Button>
                  </>
                ) : (
                  <Button className="icon-button" variant="light" onClick={() => setIsSelectingPlanilla(true)}>
                    <BsPencilFill />
                  </Button>
                )}
              </div>
            )}

            {mantenimiento.planilla ? (
              <Row className="gallery-section mt-3">
                <Col md={3} className="gallery-item">
                  <div
                    className={`photo-container ${isSelectingPlanilla ? 'selectable' : ''} ${
                      selectedPlanilla === mantenimiento.planilla ? 'selected' : ''
                    }`}
                    onClick={() => {
                      if (isSelectingPlanilla) {
                        handlePlanillaSelect(mantenimiento.planilla);
                      } else {
                        handleImageClick(mantenimiento.planilla);
                      }
                    }}
                  >
                    <img
                      src={mantenimiento.planilla}
                      alt="Planilla existente"
                      className="gallery-thumbnail"
                    />
                  </div>
                </Col>
              </Row>
            ) : (
              <p className="mt-3 text-center">No hay planilla cargada.</p>
            )}
          </Col>
          </Row>

          <Row className="photos-section mt-5">
            <h4 className="photos-title">Fotos de la obra</h4>

            <Form.Group className="text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                id="fotoUpload"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'fotos')}
              />
              <div className="d-flex justify-content-center mb-2">
                <Button
                  variant="warning"
                  className="d-flex align-items-center gap-2"
                  onClick={() => document.getElementById('fotoUpload').click()}
                >
                  <BsUpload />
                  Cargar
                </Button>
              </div>

              {formData.fotos.length > 0 && (
                <div className="text-center mb-2">
                  <strong>Archivos seleccionados:</strong>
                  <ul className="list-unstyled mb-0">
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
              <div className="d-flex justify-content-center mt-2 gap-2">
                {isSelectingPhotos ? (
                  <>
                    <Button className="icon-button" variant="danger" onClick={handleDeleteSelectedPhotos}>
                      <BsTrashFill />
                    </Button>
                    <Button
                      className="icon-button"
                      variant="secondary"
                      onClick={() => {
                        setIsSelectingPhotos(false);
                        setSelectedPhotos([]);
                      }}
                    >
                      <BsX />
                    </Button>
                  </>
                ) : (
                  <Button className="icon-button" variant="light" onClick={() => setIsSelectingPhotos(true)}>
                    <BsPencilFill />
                  </Button>
                )}
              </div>
            )}

            {mantenimiento.fotos?.length > 0 ? (
              <Row className="gallery-section mt-3">
                {mantenimiento.fotos.map((photo, index) => {
                  const isSelected = selectedPhotos.includes(photo);
                  return (
                    <Col md={3} key={index} className="gallery-item">
                      <div
                        className={`photo-container ${isSelectingPhotos ? 'selectable' : ''} ${
                          isSelected ? 'selected' : ''
                        }`}
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
            ) : (
              <p className="mt-3 text-center">No hay fotos cargadas.</p>
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
      onClick={() => navigate('/mantenimientos-correctivos')}
      className="floating-back-btn"
    >
      <FiArrowLeft size={28} color="white" />
    </button>
    </Container>
  );
};

export default Correctivo;