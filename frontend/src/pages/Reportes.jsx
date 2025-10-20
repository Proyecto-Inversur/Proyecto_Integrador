import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import useReportes from '../hooks/useReportes';
import '../styles/reportes.css';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Reportes = () => {
  const {
    month,
    months, 
    setMonth,
    year,
    years,
    setYear, 
    reportData,
    handleGenerateReports,
    generatePieChartData,
    generateBarChartData,
    handleDownloadReport
  } = useReportes();

  return (
    <div className="reports-container">
      <h1 className="report-header">Reportes</h1>
      <div className="filters-container">
        <div>
          <label htmlFor="month-select" className="date-label">Mes:</label>
          <select
          id="month-select"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="date-input"
          >
            <option value="">Todos</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="year-select" className="date-label">Año:</label>
          <select
            id="year-select"
            value={year}
            onChange={e => setYear(e.target.value)}
            className="date-input"
          >
            <option value="">Todos</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerateReports}
          className="generate-button"
        >
          Generar Reportes
        </button>
        <button
          onClick={handleDownloadReport}
          className="download-button"
        >
          Descargar Reporte
        </button>
      </div>

      {reportData.preventivos && (
        <div>
          <h2 className="report-header">Preventivos por Cuadrilla</h2>
          <div className="graph-grid">
            {generatePieChartData(reportData.preventivos, 'Preventivos').map((chart, idx) => (
              <div className="chart-card" key={idx}>
                <h3>{chart.title}</h3>
                <Pie data={chart} options={{ plugins: { legend: { position: 'bottom' } } }} />
              </div>
            ))}
          </div>
          <table className="report-table">
            <thead><tr><th>Cuadrilla</th><th>Ratio Resueltos/Asignados</th></tr></thead>
            <tbody>{reportData.preventivos.map((r, i) => <tr key={i}><td>{r.nombre}</td><td>{r.ratio}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {reportData.correctivos && (
        <div>
          <h2 className="report-header">Correctivos por Cuadrilla</h2>
          <div className="graph-grid">
            {generatePieChartData(reportData.correctivos, 'Correctivos').map((chart, idx) => (
              <div className="chart-card" key={idx}>
                <h3>{chart.title}</h3>
                <Pie data={chart} options={{ plugins: { legend: { position: 'bottom' } } }} />
              </div>
            ))}
          </div>
          <table className="report-table">
            <thead><tr><th>Cuadrilla</th><th>Ratio Resueltos/Asignados</th></tr></thead>
            <tbody>{reportData.correctivos.map((r, i) => <tr key={i}><td>{r.nombre}</td><td>{r.ratio}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {reportData.rubros && (
        <div>
          <h2 className="report-header">Días Promedio Correctivos por Rubro</h2>
          <table className="report-table">
            <thead><tr><th>Rubro</th><th>Promedio Días</th><th>Cantidad Resueltos</th></tr></thead>
            <tbody>
              {reportData.rubros.rubros.map((r, i) => <tr key={i}><td>{r.rubro}</td><td>{r.avgDays}</td><td>{r.count}</td></tr>)}
              <tr className="total-row"><td>Total General</td><td>{reportData.rubros.totalAvgDays}</td><td>{reportData.rubros.totalCount}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {reportData.zonas && (
        <div>
          <h2 className="report-header">Correctivos por Zona</h2>
          <div className="chart-card">
            <h3>Total Correctivos por Zona</h3>
            <Bar data={generateBarChartData(reportData.zonas, 'zona', 'totalCorrectivos')} options={{ plugins: { legend: { display: false } } }} />
          </div>
          <table className="report-table">
            <thead><tr><th>Zona</th><th>Total Correctivos</th><th>Promedio por Sucursal</th></tr></thead>
            <tbody>{reportData.zonas.map((z, i) => <tr key={i}><td>{z.zona}</td><td>{z.totalCorrectivos}</td><td>{z.avgCorrectivos}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {reportData.sucursales && (
        <div>
          <h2 className="report-header">Correctivos por Sucursal</h2>
          <div className="chart-card">
            <h3>Total Correctivos por Sucursal</h3>
            <Bar data={generateBarChartData(reportData.sucursales, 'sucursal', 'totalCorrectivos')} options={{ plugins: { legend: { display: false } } }} />
          </div>
          <table className="report-table">
            <thead><tr><th>Sucursal</th><th>Zona</th><th>Total Correctivos</th></tr></thead>
            <tbody>{reportData.sucursales.map((s, i) => <tr key={i}><td>{s.sucursal}</td><td>{s.zona}</td><td>{s.totalCorrectivos}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reportes;
