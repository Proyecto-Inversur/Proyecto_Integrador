import React from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import { deleteMantenimientoPlanilla } from '../services/mantenimientoPreventivoService';
import { FiArrowLeft, FiMessageSquare } from "react-icons/fi";
import usePreventivo from '../hooks/usePreventivo';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import MantenimientoInfo from '../components/MantenimientoInfo';
import ChatSection from '../components/ChatSection';
import PlanillaSection from '../components/PlanillaSection';
import PhotoSection from '../components/PhotoSection';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/mantenimientos.css';

const Preventivo = () => {
  const location = useLocation();
  const mantenimientoId = location.state?.mantenimientoId;

  const {
    uid,
    isUser,
    mantenimiento,
    formData,
    error,
    success,
    isLoading,
    isSelected,
    mensajes,
    nuevoMensaje,
    archivoAdjunto,
    previewArchivoAdjunto,
    isChatOpen,
    chatBoxRef,
    setNuevoMensaje,
    setArchivoAdjunto,
    setPreviewArchivoAdjunto,
    setIsChatOpen,
    handlePhotoUpload,
    handleExtendidoChange,
    handleDeleteSelectedPhotos,
    handleSubmit,
    handleFinish,
    handleEnviarMensaje,
    fetchMantenimiento,
    setFormData,
    setIsLoading,
    setSuccess,
    setError,
    showModal,
    selectedImage,
    handleImageClick,
    handleCloseModal,
    toggleRoute,
    getSucursalNombre,
    getCuadrillaNombre,
    getZonaNombre,
    formatExtendido,
    isMobile,
  } = usePreventivo(mantenimientoId);

  return (
    <Container fluid className="mantenimiento-container">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="page-content">
          <Row className="main-row">
            <MantenimientoInfo
              title="Mantenimiento Preventivo"
              mantenimiento={mantenimiento}
              isUser={isUser}
              formData={formData}
              getSucursalNombre={getSucursalNombre}
              getCuadrillaNombre={getCuadrillaNombre}
              getZonaNombre={getZonaNombre}
              formatExtendido={formatExtendido}
              handleExtendidoChange={handleExtendidoChange}
              handleSubmit={handleSubmit}
              error={error}
              success={success}
              toggleRoute={toggleRoute}
              isSelected={isSelected}
              isLoading={isLoading}
              showFinishButton={mantenimiento.fecha_cierre === null}
              handleFinish={handleFinish}
            />
            {!isMobile && (
              <Col className="chat-section">
                <ChatSection
                  mensajes={mensajes}
                  nuevoMensaje={nuevoMensaje}
                  setNuevoMensaje={setNuevoMensaje}
                  archivoAdjunto={archivoAdjunto}
                  setArchivoAdjunto={setArchivoAdjunto}
                  previewArchivoAdjunto={previewArchivoAdjunto}
                  setPreviewArchivoAdjunto={setPreviewArchivoAdjunto}
                  onEnviarMensaje={handleEnviarMensaje}
                  chatBoxRef={chatBoxRef}
                  currentUid={uid}
                />
              </Col>
            )}
            <PlanillaSection
              multiple
              mantenimiento={mantenimiento}
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              deletePlanilla={deleteMantenimientoPlanilla}
              handleImageClick={handleImageClick}
              fetchMantenimiento={fetchMantenimiento}
              setIsLoading={setIsLoading}
              isLoading={isLoading}
              setSuccess={setSuccess}
              setError={setError}
            />
          </Row>
          <PhotoSection
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            fotos={mantenimiento.fotos || []}
            onUpload={handlePhotoUpload}
            onDelete={handleDeleteSelectedPhotos}
            titulo="Fotos de la obra"
          />
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
          {isMobile && (
            <>
              {!isChatOpen && (
                <button
                  type="button"
                  className="floating-chat-btn"
                  onClick={() => setIsChatOpen(true)}
                >
                  <FiMessageSquare size={28} color="white" />
                </button>
              )}
              <div className={`chat-overlay ${isChatOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="close-chat-btn"
                  onClick={() => setIsChatOpen(false)}
                >
                  <FiArrowLeft size={28} color="black" />
                </button>
                <div className="chat-section">
                  <ChatSection
                    mensajes={mensajes}
                    nuevoMensaje={nuevoMensaje}
                    setNuevoMensaje={setNuevoMensaje}
                    archivoAdjunto={archivoAdjunto}
                    setArchivoAdjunto={setArchivoAdjunto}
                    previewArchivoAdjunto={previewArchivoAdjunto}
                    setPreviewArchivoAdjunto={setPreviewArchivoAdjunto}
                    onEnviarMensaje={handleEnviarMensaje}
                    chatBoxRef={chatBoxRef}
                    currentUid={uid}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <BackButton to="/mantenimientos-preventivos" />
    </Container>
  );
};

export default Preventivo;