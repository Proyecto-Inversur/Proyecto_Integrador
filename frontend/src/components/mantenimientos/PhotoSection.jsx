import React, { useEffect, useRef, useState } from 'react';
import { Row, Col, Button, Form, Modal } from 'react-bootstrap';
import { BsUpload, BsTrashFill, BsPencilFill, BsX, BsSave } from 'react-icons/bs';

const PhotoSection = ({ handleSubmit, isLoading, fotos = [], onUpload, onDelete, titulo }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fotoPreviews, setFotoPreviews] = useState([]);
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSelectedFiles([]);
    setFotoPreviews([]);
  }, [fotos]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setFotoPreviews(files.map(file => URL.createObjectURL(file)));
    if (onUpload) {
      onUpload(files);
    }
  };

  const handlePhotoSelect = (photo) => {
    setSelectedPhotos(prev =>
      prev.includes(photo) ? prev.filter(p => p !== photo) : [...prev, photo]
    );
  };

  const handleSavePhotos = async () => {
    if (selectedFiles.length === 0) return setError("Seleccione fotos para guardar.");
    await handleSubmit({ preventDefault: () => {} });
    setSelectedFiles([]);
    setFotoPreviews([]);
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(selectedPhotos);
    }
    setSelectedPhotos([]);
    setIsSelectingPhotos(false);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  return (
    <Row className="photos-section mt-5">
      <h4 className="photos-title">{titulo}</h4>

      <Form.Group className="text-center">
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          id="photoUpload"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div className="d-flex justify-content-center mb-2">
          <Button
            variant="warning"
            className="d-flex align-items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <BsUpload />
            Cargar
          </Button>
        </div>

        {selectedFiles.length > 0 && (
          <div className="text-center mb-2">
            <strong>Archivos seleccionados:</strong>
            <ul className="list-unstyled mb-0">
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
            <div className="d-flex justify-content-center mt-2">
              <Button type="submit" variant="success" className="section-save-btn" disabled={isLoading} onClick={handleSavePhotos}>
                <BsSave className="me-2" /> Guardar Fotos
              </Button>
            </div>
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

      {fotos.length > 0 && (
        <div className="d-flex justify-content-center mt-2 gap-2">
          {isSelectingPhotos ? (
            <>
              <Button className="icon-button" variant="danger" onClick={handleDelete}>
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
            <Button
              className="icon-button"
              variant="light"
              onClick={() => setIsSelectingPhotos(true)}
            >
              <BsPencilFill />
            </Button>
          )}
        </div>
      )}

      {fotos.length > 0 ? (
        <Row className="gallery-section mt-3">
          {fotos.map((photo, index) => {
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
    </Row>
  );
};

export default PhotoSection;