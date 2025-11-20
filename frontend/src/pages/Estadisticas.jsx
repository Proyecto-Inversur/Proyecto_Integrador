import React, { useEffect, useMemo, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Form } from 'react-bootstrap';
import useEstadisticas from '../hooks/useEstadisticas';
import '../styles/estadisticas.css';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const MultiSelectDropdown = ({ id, label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const allSelected = selectedValues.length === options.length;

  const toggleValue = (value) => {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const selectedLabel = allSelected
    ? 'Todos'
    : `${selectedValues.length} seleccionados`;

  return (
    <div className="multi-select">
      <button
        type="button"
        className="multi-select-toggle"
        aria-expanded={isOpen}
        aria-controls={`${id}-menu`}
        onClick={() => setIsOpen((open) => !open)}
      >
        {label}: {selectedLabel}
      </button>
      {isOpen && (
        <div className="multi-select-menu" id={`${id}-menu`}>
          <label className="multi-select-option">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
            />
            <span>Todos</span>
          </label>
          <div className="multi-select-divider" />
          {options.map((option) => (
            <label key={option.value} className="multi-select-option">
              <input
                type="checkbox"
                checked={allSelected || selectedValues.includes(option.value)}
                onChange={() => toggleValue(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const Estadisticas = () => {
  const {
    selectedMonths,
    months,
    setSelectedMonths,
    selectedYears,
    years,
    setSelectedYears,
    clientes,
    zonas,
    sucursales,
    cuadrillas,
    isLoadingData,
    estadisticasData,
    handleGenerateEstadisticas,
    generatePieChartData,
    generateBarChartData,
    handleDownloadEstadisticas,
  } = useEstadisticas();

  const [preventivoFilters, setPreventivoFilters] = useState({
    cliente: '',
    zona: '',
    sucursal: '',
    cuadrilla: '',
  });
  const [correctivoFilters, setCorrectivoFilters] = useState({
    cliente: '',
    zona: '',
    sucursal: '',
    cuadrilla: '',
  });
  const [rubroFilters, setRubroFilters] = useState({
    cliente: '',
    zona: '',
    sucursal: '',
    cuadrilla: '',
  });
  const [zonaFilters, setZonaFilters] = useState({
    cliente: '',
    cuadrilla: '',
  });
  const [sucursalFilters, setSucursalFilters] = useState({
    cliente: '',
    zona: '',
    cuadrilla: '',
  });

  const updatePreventivoFilters = (field, value) => {
    setPreventivoFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'cliente' || field === 'zona') {
        next.sucursal = '';
      }
      return next;
    });
  };

  const updateCorrectivoFilters = (field, value) => {
    setCorrectivoFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'cliente' || field === 'zona') {
        next.sucursal = '';
      }
      return next;
    });
  };

  const updateRubroFilters = (field, value) => {
    setRubroFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'cliente' || field === 'zona') {
        next.sucursal = '';
      }
      return next;
    });
  };

  const updateZonaFilters = (field, value) => {
    setZonaFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSucursalFilters = (field, value) => {
    setSucursalFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'cliente') {
        next.zona = '';
      }
      return next;
    });
  };

  const getSucursalOptions = (clienteId, zonaName) => {
    return sucursales.filter((sucursal) => {
      if (clienteId && String(sucursal.cliente_id) !== clienteId) return false;
      if (zonaName && sucursal.zona !== zonaName) return false;
      return true;
    });
  };

  const preventivoSucursalOptions = useMemo(
    () => getSucursalOptions(preventivoFilters.cliente, preventivoFilters.zona),
    [preventivoFilters.cliente, preventivoFilters.zona, sucursales]
  );

  const correctivoSucursalOptions = useMemo(
    () => getSucursalOptions(correctivoFilters.cliente, correctivoFilters.zona),
    [correctivoFilters.cliente, correctivoFilters.zona, sucursales]
  );

  const rubroSucursalOptions = useMemo(
    () => getSucursalOptions(rubroFilters.cliente, rubroFilters.zona),
    [rubroFilters.cliente, rubroFilters.zona, sucursales]
  );

  const filtersPayload = useMemo(() => ({
    preventivos: preventivoFilters,
    correctivos: correctivoFilters,
    rubros: rubroFilters,
    zonas: zonaFilters,
    sucursales: sucursalFilters,
  }), [preventivoFilters, correctivoFilters, rubroFilters, zonaFilters, sucursalFilters]);

  const renderEmptyState = (text) => (
    <div className="no-data-alert">
      {text}
    </div>
  );

  useEffect(() => {
    if (!isLoadingData) {
      handleGenerateEstadisticas(filtersPayload);
    }
  }, [filtersPayload, handleGenerateEstadisticas, isLoadingData, selectedMonths, selectedYears]);

  return (
    <div className="reports-container">
      <h1 className="report-header">Estadísticas</h1>

      <div className="report-filter-panel">
        <div className="filter-panel-content">
          <div className="filter-panel-text">
            <h2 className="filter-panel-title">Periodo del reporte</h2>
            <p className="report-description">
              Seleccioná uno o más meses y años para analizar; las estadísticas se actualizan automáticamente al cambiar cualquier filtro.
            </p>
          </div>
          <div className="filter-panel-controls">
            <div className="maintenance-filters-row">
              <div className="maintenance-filter-item">
                <Form.Group className="mb-0" controlId="month-select">
                  <Form.Label className="mb-2">Meses</Form.Label>
                  <MultiSelectDropdown
                    id="months"
                    label="Meses"
                    options={months}
                    selectedValues={selectedMonths}
                    onChange={setSelectedMonths}
                  />
                </Form.Group>
              </div>
              <div className="maintenance-filter-item">
                <Form.Group className="mb-0" controlId="year-select">
                  <Form.Label className="mb-2">Años</Form.Label>
                  <MultiSelectDropdown
                    id="years"
                    label="Años"
                    options={years.map((y) => ({ value: y, label: y }))}
                    selectedValues={selectedYears}
                    onChange={setSelectedYears}
                  />
                </Form.Group>
              </div>
            </div>
            <div className="report-actions">
              <button onClick={handleDownloadEstadisticas} className="download-button">
                Descargar Estadísticas
              </button>
            </div>
          </div>
        </div>
      </div>

      {estadisticasData.preventivos && (
        <section className="report-section">
          <div className="section-header">
            <div>
              <h2 className="report-section-title">Preventivos por Cuadrilla</h2>
              <p className="report-description">
                Evalúa el cumplimiento de trabajos preventivos por equipo, comparando asignaciones contra tareas cerradas.
              </p>
            </div>
            <div className="section-filters">
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="preventivos-cliente">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Select
                    value={preventivoFilters.cliente}
                    onChange={(e) => updatePreventivoFilters('cliente', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="preventivos-zona">
                  <Form.Label>Zona</Form.Label>
                  <Form.Select
                    value={preventivoFilters.zona}
                    onChange={(e) => updatePreventivoFilters('zona', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {zonas.map((zona) => (
                      <option key={zona.id} value={zona.nombre}>
                        {zona.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="preventivos-sucursal">
                  <Form.Label>Sucursal</Form.Label>
                  <Form.Select
                    value={preventivoFilters.sucursal}
                    onChange={(e) => updatePreventivoFilters('sucursal', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {preventivoSucursalOptions.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="preventivos-cuadrilla">
                  <Form.Label>Cuadrilla</Form.Label>
                  <Form.Select
                    value={preventivoFilters.cuadrilla}
                    onChange={(e) => updatePreventivoFilters('cuadrilla', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {cuadrillas.map((cuadrilla) => (
                      <option key={cuadrilla.id} value={cuadrilla.id}>
                        {cuadrilla.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </div>
          {estadisticasData.preventivos.length === 0
            ? renderEmptyState('No se encontraron preventivos para los filtros aplicados.')
            : (
              <>
                <div className="graph-grid">
                  {generatePieChartData(estadisticasData.preventivos, 'Preventivos').map((chart, idx) => (
                    <div className="chart-card" key={idx}>
                      <h3>{chart.title}</h3>
                      <Pie data={chart} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                  ))}
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Cuadrilla</th>
                      <th>Ratio Resueltos/Asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticasData.preventivos.map((r, i) => (
                      <tr key={i}>
                        <td>{r.nombre}</td>
                        <td>{r.ratio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </section>
      )}

      {estadisticasData.correctivos && (
        <section className="report-section">
          <div className="section-header">
            <div>
              <h2 className="report-section-title">Correctivos por Cuadrilla</h2>
              <p className="report-description">
                Identifica qué cuadrillas están resolviendo más correctivos y dónde hay cuellos de botella.
              </p>
            </div>
            <div className="section-filters">
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="correctivos-cliente">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Select
                    value={correctivoFilters.cliente}
                    onChange={(e) => updateCorrectivoFilters('cliente', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="correctivos-zona">
                  <Form.Label>Zona</Form.Label>
                  <Form.Select
                    value={correctivoFilters.zona}
                    onChange={(e) => updateCorrectivoFilters('zona', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {zonas.map((zona) => (
                      <option key={zona.id} value={zona.nombre}>
                        {zona.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="correctivos-sucursal">
                  <Form.Label>Sucursal</Form.Label>
                  <Form.Select
                    value={correctivoFilters.sucursal}
                    onChange={(e) => updateCorrectivoFilters('sucursal', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {correctivoSucursalOptions.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="correctivos-cuadrilla">
                  <Form.Label>Cuadrilla</Form.Label>
                  <Form.Select
                    value={correctivoFilters.cuadrilla}
                    onChange={(e) => updateCorrectivoFilters('cuadrilla', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {cuadrillas.map((cuadrilla) => (
                      <option key={cuadrilla.id} value={cuadrilla.id}>
                        {cuadrilla.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </div>
          {estadisticasData.correctivos.length === 0
            ? renderEmptyState('No se encontraron correctivos para los filtros aplicados.')
            : (
              <>
                <div className="graph-grid">
                  {generatePieChartData(estadisticasData.correctivos, 'Correctivos').map((chart, idx) => (
                    <div className="chart-card" key={idx}>
                      <h3>{chart.title}</h3>
                      <Pie data={chart} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                  ))}
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Cuadrilla</th>
                      <th>Ratio Resueltos/Asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticasData.correctivos.map((r, i) => (
                      <tr key={i}>
                        <td>{r.nombre}</td>
                        <td>{r.ratio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </section>
      )}

      {estadisticasData.rubros && (
        <section className="report-section">
          <div className="section-header">
            <div>
              <h2 className="report-section-title">Días Promedio Correctivos por Rubro</h2>
              <p className="report-description">
                Visualiza cuánto se demora en cerrar los correctivos de cada rubro para priorizar recursos críticos.
              </p>
            </div>
            <div className="section-filters">
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="rubros-cliente">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Select
                    value={rubroFilters.cliente}
                    onChange={(e) => updateRubroFilters('cliente', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="rubros-zona">
                  <Form.Label>Zona</Form.Label>
                  <Form.Select
                    value={rubroFilters.zona}
                    onChange={(e) => updateRubroFilters('zona', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {zonas.map((zona) => (
                      <option key={zona.id} value={zona.nombre}>
                        {zona.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="rubros-sucursal">
                  <Form.Label>Sucursal</Form.Label>
                  <Form.Select
                    value={rubroFilters.sucursal}
                    onChange={(e) => updateRubroFilters('sucursal', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {rubroSucursalOptions.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="rubros-cuadrilla">
                  <Form.Label>Cuadrilla</Form.Label>
                  <Form.Select
                    value={rubroFilters.cuadrilla}
                    onChange={(e) => updateRubroFilters('cuadrilla', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {cuadrillas.map((cuadrilla) => (
                      <option key={cuadrilla.id} value={cuadrilla.id}>
                        {cuadrilla.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </div>
          {estadisticasData.rubros.rubros.length === 0
            ? renderEmptyState('No se encontraron correctivos finalizados para los filtros seleccionados.')
            : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Rubro</th>
                    <th>Promedio Días</th>
                    <th>Cantidad Resueltos</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticasData.rubros.rubros.map((r, i) => (
                    <tr key={i}>
                      <td>{r.rubro}</td>
                      <td>{r.avgDays}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td>Total General</td>
                    <td>{estadisticasData.rubros.totalAvgDays}</td>
                    <td>{estadisticasData.rubros.totalCount}</td>
                  </tr>
                </tbody>
              </table>
            )}
        </section>
      )}

      {estadisticasData.zonas && (
        <section className="report-section">
          <div className="section-header">
            <div>
              <h2 className="report-section-title">Correctivos por Zona</h2>
              <p className="report-description">
                Conoce la distribución geográfica de correctivos para anticipar las zonas con mayor demanda.
              </p>
            </div>
            <div className="section-filters">
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="zonas-cliente">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Select
                    value={zonaFilters.cliente}
                    onChange={(e) => updateZonaFilters('cliente', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="zonas-cuadrilla">
                  <Form.Label>Cuadrilla</Form.Label>
                  <Form.Select
                    value={zonaFilters.cuadrilla}
                    onChange={(e) => updateZonaFilters('cuadrilla', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {cuadrillas.map((cuadrilla) => (
                      <option key={cuadrilla.id} value={cuadrilla.id}>
                        {cuadrilla.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </div>
          {estadisticasData.zonas.length === 0
            ? renderEmptyState('No hay correctivos para las zonas seleccionadas.')
            : (
              <>
                <div className="chart-card">
                  <h3>Total Correctivos por Zona</h3>
                  <Bar
                    data={generateBarChartData(estadisticasData.zonas, 'zona', 'totalCorrectivos')}
                    options={{ plugins: { legend: { display: false } } }}
                  />
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Zona</th>
                      <th>Total Correctivos</th>
                      <th>Promedio por Sucursal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticasData.zonas.map((z, i) => (
                      <tr key={i}>
                        <td>{z.zona}</td>
                        <td>{z.totalCorrectivos}</td>
                        <td>{z.avgCorrectivos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </section>
      )}

      {estadisticasData.sucursales && (
        <section className="report-section">
          <div className="section-header">
            <div>
              <h2 className="report-section-title">Correctivos por Sucursal</h2>
              <p className="report-description">
                Detalla qué sucursales concentran más incidencias correctivas dentro del período seleccionado.
              </p>
            </div>
            <div className="section-filters">
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="sucursales-cliente">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Select
                    value={sucursalFilters.cliente}
                    onChange={(e) => updateSucursalFilters('cliente', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="sucursales-zona">
                  <Form.Label>Zona</Form.Label>
                  <Form.Select
                    value={sucursalFilters.zona}
                    onChange={(e) => updateSucursalFilters('zona', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {zonas.map((zona) => (
                      <option key={zona.id} value={zona.nombre}>
                        {zona.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="section-filter-item">
                <Form.Group className="mb-0" controlId="sucursales-cuadrilla">
                  <Form.Label>Cuadrilla</Form.Label>
                  <Form.Select
                    value={sucursalFilters.cuadrilla}
                    onChange={(e) => updateSucursalFilters('cuadrilla', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {cuadrillas.map((cuadrilla) => (
                      <option key={cuadrilla.id} value={cuadrilla.id}>
                        {cuadrilla.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </div>
          {estadisticasData.sucursales.length === 0
            ? renderEmptyState('No se encontraron sucursales para los filtros seleccionados.')
            : (
              <>
                <div className="chart-card">
                  <h3>Total Correctivos por Sucursal</h3>
                  <Bar
                    data={generateBarChartData(estadisticasData.sucursales, 'sucursal', 'totalCorrectivos')}
                    options={{ plugins: { legend: { display: false } } }}
                  />
                </div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Sucursal</th>
                      <th>Zona</th>
                      <th>Total Correctivos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticasData.sucursales.map((s, i) => (
                      <tr key={i}>
                        <td>{s.sucursal}</td>
                        <td>{s.zona}</td>
                        <td>{s.totalCorrectivos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
        </section>
      )}
    </div>
  );
};

export default Estadisticas;
