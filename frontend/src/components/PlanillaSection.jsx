import React, { useState } from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';
import { BsUpload, BsTrashFill, BsPencilFill, BsX, BsSave } from 'react-icons/bs';

const PlanillaSection = ({
  multiple = false,
  mantenimiento,
  formData,
  setFormData,
  handleSubmit,
  deletePlanilla,
  handleImageClick,
  fetchMantenimiento,
  setIsLoading,
  isLoading,
  setSuccess,
  setError,
}) => {
  const [planillaPreviews, setPlanillaPreviews] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selected, setSelected] = useState(multiple ? [] : null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (multiple) {
      setFormData(prev => ({ ...prev, planillas: files }));
      setPlanillaPreviews(files.map(file => URL.createObjectURL(file)));
    } else {
      const file = files[0];
      setFormData(prev => ({ ...prev, planilla: file || '' }));
      setPlanillaPreviews(file ? [URL.createObjectURL(file)] : []);
    }
  };

  const handleSelect = (planillaUrl) => {
    if (multiple) {
      setSelected(prev =>
        prev.includes(planillaUrl)
          ? prev.filter(url => url !== planillaUrl)
          : [...prev, planillaUrl]
      );
    } else {
      setSelected(prev => (prev === planillaUrl ? null : planillaUrl));
    }
  };

  const handleSavePlanilla = async () => {
    if (multiple) {
      if (!formData.planillas || formData.planillas.length === 0) return setError("Seleccione planillas para guardar.");
        await handleSubmit({ preventDefault: () => {} });
        setFormData((prev) => ({ ...prev, planillas: [] }))
        setPlanillaPreviews([]);
    } else {
      if (!formData.planilla) return setError("Seleccione una planilla para guardar.")
      await handleSubmit({ preventDefault: () => {} });
      setFormData((prev) => ({ ...prev, planilla: "" }))
      setPlanillaPreviews([]);
    }
  }

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      if (multiple) {
        for (const planillaUrl of selected) {
          const fileName = planillaUrl.split('/').pop();
          await deletePlanilla(mantenimiento.id, fileName);
        }
        setSelected([]);
      } else if (selected) {
        const fileName = selected.split('/').pop();
        await deletePlanilla(mantenimiento.id, fileName);
        setSelected(null);
      }
      setSuccess('Planilla(s) eliminada(s) correctamente.');
      await fetchMantenimiento();
    } catch (error) {
      console.error('Error deleting planillas:', error);
      setError('Error al eliminar las planillas.');
    } finally {
      setIsLoading(false);
      setIsSelecting(false);
    }
  };

  const existingPlanillas = multiple
    ? mantenimiento.planillas || []
    : mantenimiento.planilla
    ? [mantenimiento.planilla]
    : [];

  return (
    <Col xs={12} md={4} className="planilla-section">
      <h4 className="planilla-section-title">{multiple ? 'Planillas' : 'Planilla'}</h4>
      <Form.Group>
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          id="planillaUpload"
          style={{ display: 'none' }}
          onChange={handleFileChange}
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
        {multiple ? (
          formData.planillas?.length > 0 && (
            <div className="text-center mb-2">
              <strong>Archivos seleccionados:</strong>
              <ul className="list-unstyled mb-0">
                {formData.planillas.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
              <div className="d-flex justify-content-center mt-2">
                <Button
                  type="submit"
                  variant="success"
                  className="section-save-btn"
                  disabled={isLoading}
                  onClick={handleSavePlanilla}
                >
                  <BsSave className="me-2" /> Guardar Planillas
                </Button>
              </div>
            </div>
          )
        ) : (
          formData.planilla && (
            <div className="selected-files mt-2">
              <strong>Archivo seleccionado:</strong>
              <ul>
                <li>{formData.planilla.name}</li>
              </ul>
              <div className="d-flex justify-content-center mt-2">
                <Button
                  type="submit"
                  variant="success"
                  className="section-save-btn"
                  disabled={isLoading}
                  onClick={handleSavePlanilla}
                >
                  <BsSave className="me-2" /> Guardar Planilla
                </Button>
              </div>
            </div>
          )
        )}
      </Form.Group>

      {planillaPreviews.length > 0 && (
        <Row className="gallery-section mt-3">
          {planillaPreviews.map((preview, index) => (
            <Col md={3} key={index} className="gallery-item">
              <div className="photo-container">
                <img
                  src={preview}
                  alt={multiple ? `Nueva planilla ${index + 1}` : 'Nueva planilla'}
                  className="gallery-thumbnail"
                  onClick={() => handleImageClick(preview)}
                />
              </div>
            </Col>
          ))}
        </Row>
      )}

      {existingPlanillas.length > 0 && (
        <div className="d-flex justify-content-center gap-2 mt-2">
          {isSelecting ? (
            <>
              <Button className="icon-button" variant="danger" onClick={handleDelete}>
                <BsTrashFill />
              </Button>
              <Button
                className="icon-button"
                variant="secondary"
                onClick={() => {
                  setIsSelecting(false);
                  setSelected(multiple ? [] : null);
                }}
              >
                <BsX />
              </Button>
            </>
          ) : (
            <Button className="icon-button" variant="light" onClick={() => setIsSelecting(true)}>
              <BsPencilFill />
            </Button>
          )}
        </div>
      )}

      {existingPlanillas.length > 0 ? (
        <Row className="gallery-section mt-3">
          {existingPlanillas.map((planilla, index) => (
            <Col md={3} key={index} className="gallery-item">
              <div
                className={`photo-container ${isSelecting ? 'selectable' : ''} ${
                  multiple
                    ? selected.includes(planilla)
                      ? 'selected'
                      : ''
                    : selected === planilla
                    ? 'selected'
                    : ''
                }`}
                onClick={() => {
                  if (isSelecting) {
                    handleSelect(planilla);
                  } else {
                    handleImageClick(planilla);
                  }
                }}
              >
                <img
                  src={planilla}
                  alt={multiple ? `Planilla ${index + 1}` : 'Planilla existente'}
                  className="gallery-thumbnail"
                />
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <p className={`mt-3 ${multiple ? '' : 'text-center'}`}>
          {multiple ? 'No hay planillas cargadas.' : 'No hay planilla cargada.'}
        </p>
      )}
    </Col>
  );
};

export default PlanillaSection;