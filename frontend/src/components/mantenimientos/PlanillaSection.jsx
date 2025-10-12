import React, { useRef, useState } from 'react';
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
  const previewsRef = useRef(null);
  const existingRef = useRef(null);
  const SLIDE = 200; 
  const scrollByRef = (ref, dir = 1) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * SLIDE, behavior: 'smooth' });
  };

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
          aria-labelledby="cargarPlanillaBtn"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div className="d-flex justify-content-center mb-2">
          <Button
            id="cargarPlanillaBtn"
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
        <div className="planilla-carousel">
          {planillaPreviews.length >= 2 && (
            <>
              <button className="planilla-nav prev" type="button" onClick={() => scrollByRef(previewsRef, -1)}>‹</button>
              <button className="planilla-nav next" type="button" onClick={() => scrollByRef(previewsRef, +1)}>›</button>
            </>
          )}
          <div className="planilla-viewport" ref={previewsRef}>
            <div className={`planilla-track ${planillaPreviews.length === 1 ? 'single' : ''}`}>
              {planillaPreviews.map((preview, index) => (
                <div className="planilla-slide" key={`preview-${index}`}>
                  <div className="photo-container">
                    <img
                      src={preview}
                      alt={multiple ? `Nueva planilla ${index + 1}` : 'Nueva planilla'}
                      className="gallery-thumbnail"
                      onClick={() => handleImageClick(preview)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {existingPlanillas.length > 0 && (
        <div className="d-flex justify-content-center gap-2 mt-2">
          {isSelecting ? (
            <>
              <Button aria-label="eliminar" className="icon-button" variant="danger" onClick={handleDelete}>
                <BsTrashFill />
              </Button>
              <Button
                aria-label="cancelar"
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
            <Button aria-label="editar" className="icon-button" variant="light" onClick={() => setIsSelecting(true)}>
              <BsPencilFill />
            </Button>
          )}
        </div>
      )}

      {existingPlanillas.length > 0 ? (
        <>
          <div className="planilla-carousel">
            {existingPlanillas.length >= 2 && (
              <>
                <button className="planilla-nav prev" type="button" onClick={() => scrollByRef(existingRef, -1)}>‹</button>
                <button className="planilla-nav next" type="button" onClick={() => scrollByRef(existingRef, +1)}>›</button>
              </>
            )}
            <div className="planilla-viewport" ref={existingRef}>
              <div className={`planilla-track ${existingPlanillas.length === 1 ? 'single' : ''}`}>
                {existingPlanillas.map((planilla, index) => {
                  const isSel = multiple ? selected.includes(planilla) : selected === planilla;
                  return (
                    <div className="planilla-slide" key={`existente-${index}`}>
                      <div
                        className={`photo-container ${isSelecting ? 'selectable' : ''} ${isSel ? 'selected' : ''}`}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className={`mt-3 ${multiple ? '' : 'text-center'}`}>
          {multiple ? 'No hay planillas cargadas.' : 'No hay planilla cargada.'}
        </p>
      )}
    </Col>
  );
};

export default PlanillaSection;