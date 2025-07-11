import { useState, useEffect } from 'react';
import { getCuadrillas } from '../services/cuadrillaService';
import { getMantenimientosCorrectivos } from '../services/mantenimientoCorrectivoService';
import { getMantenimientosPreventivos } from '../services/mantenimientoPreventivoService';
import { getSucursales } from '../services/sucursalService';
import { getZonas } from '../services/zonaService';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import '../styles/reportes.css';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Reportes = () => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [cuadrillas, setCuadrillas] = useState([]);
  const [correctivos, setCorrectivos] = useState([]);
  const [preventivos, setPreventivos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [reportData, setReportData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const [cuadrillasRes, correctivosRes, preventivosRes, zonasRes, sucursalesRes] = await Promise.all([
        getCuadrillas(),
        getMantenimientosCorrectivos(),
        getMantenimientosPreventivos(),
        getZonas(),
        getSucursales(),
      ]);
      setCuadrillas(cuadrillasRes.data);
      setCorrectivos(correctivosRes.data);
      setPreventivos(preventivosRes.data);
      setZonas(zonasRes.data);
      setSucursales(sucursalesRes.data);
    };
    fetchData();
  }, []);

  const filterByMonthYear = (items, dateField) => {
    if (!month || !year) return items;
    return items.filter(item => {
      const date = new Date(item[dateField]);
      return date.getMonth() + 1 === parseInt(month) && date.getFullYear() === parseInt(year);
    });
  };

  const generatePreventivoReport = () => {
    const filteredPreventivos = filterByMonthYear(preventivos, 'fecha_apertura');
    const report = cuadrillas.map(cuadrilla => {
      const asignados = filteredPreventivos.filter(p => p.id_cuadrilla === cuadrilla.id).length;
      const resueltos = filteredPreventivos.filter(p => p.id_cuadrilla === cuadrilla.id && p.fecha_cierre).length;
      return {
        nombre: cuadrilla.nombre,
        ratio: asignados ? (resueltos / asignados).toFixed(2) : 0,
        resueltos,
        asignados,
      };
    });
    return report;
  };

  const generateCorrectivoReport = () => {
    const filteredCorrectivos = filterByMonthYear(correctivos, 'fecha_apertura');
    const report = cuadrillas.map(cuadrilla => {
      const asignados = filteredCorrectivos.filter(c => c.id_cuadrilla === cuadrilla.id).length;
      const resueltos = filteredCorrectivos.filter(c => c.id_cuadrilla === cuadrilla.id && c.estado === 'Finalizado').length;
      return {
        nombre: cuadrilla.nombre,
        ratio: asignados ? (resueltos / asignados).toFixed(2) : 0,
        resueltos,
        asignados,
      };
    });
    return report;
  };

  const generateRubroReport = () => {
    const filteredCorrectivos = filterByMonthYear(correctivos.filter(c => c.estado === 'Finalizado'), 'fecha_apertura');
    const rubros = [...new Set(filteredCorrectivos.map(c => c.rubro))];
    const report = rubros.map(rubro => {
      const rubroCorrectivos = filteredCorrectivos.filter(c => c.rubro === rubro);
      const days = rubroCorrectivos.map(c => {
        const apertura = new Date(c.fecha_apertura);
        const cierre = new Date(c.fecha_cierre);
        return (cierre - apertura) / (1000 * 60 * 60 * 24);
      });
      const avgDays = days.length ? (days.reduce((a, b) => a + b, 0) / days.length).toFixed(2) : 0;
      return { rubro, avgDays, count: rubroCorrectivos.length };
    });
    const totalAvgDays = filteredCorrectivos.length
      ? (filteredCorrectivos.reduce((sum, c) => {
          const apertura = new Date(c.fecha_apertura);
          const cierre = new Date(c.fecha_cierre);
          return sum + (cierre - apertura) / (1000 * 60 * 60 * 24);
        }, 0) / filteredCorrectivos.length).toFixed(2)
      : 0;
    return { rubros: report, totalAvgDays };
  };

  const generateZonaReport = () => {
    const filteredCorrectivos = filterByMonthYear(correctivos, 'fecha_apertura');
    const report = zonas.map(zona => {
      const zonaSucursales = sucursales.filter(s => s.zona === zona.nombre);
      const correctivosZona = filteredCorrectivos.filter(c => zonaSucursales.some(s => s.id === c.id_sucursal));
      const avgCorrectivos = zonaSucursales.length
        ? (correctivosZona.length / zonaSucursales.length).toFixed(2)
        : 0;
      return { zona: zona.nombre, totalCorrectivos: correctivosZona.length, avgCorrectivos };
    });
    return report;
  };

  const generateSucursalReport = () => {
    const filteredCorrectivos = filterByMonthYear(correctivos, 'fecha_apertura');
    const report = sucursales.map(sucursal => {
      const correctivosSucursal = filteredCorrectivos.filter(c => c.id_sucursal === sucursal.id);
      return { sucursal: sucursal.nombre, zona: sucursal.zona, totalCorrectivos: correctivosSucursal.length };
    });
    return report;
  };

  const handleGenerateReports = () => {
    setReportData({
      preventivos: generatePreventivoReport(),
      correctivos: generateCorrectivoReport(),
      rubros: generateRubroReport(),
      zonas: generateZonaReport(),
      sucursales: generateSucursalReport(),
    });
  };

  const generatePieChartData = (report, type) => {
    return report.map(item => ({
      labels: ['Resueltos', 'No Resueltos'],
      datasets: [{
        data: [item.resueltos, item.asignados - item.resueltos],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverOffset: 20,
      }],
      title: `${type} - ${item.nombre}`,
    }));
  };

  const generateZonaBarChartData = () => {
    return {
      labels: reportData.zonas?.map(item => item.zona) || [],
      datasets: [{
        label: 'Total Correctivos',
        data: reportData.zonas?.map(item => item.totalCorrectivos) || [],
        backgroundColor: '#36A2EB',
      }],
    };
  };

  const generateSucursalBarChartData = () => {
    return {
      labels: reportData.sucursales?.map(item => item.sucursal) || [],
      datasets: [{
        label: 'Total Correctivos',
        data: reportData.sucursales?.map(item => item.totalCorrectivos) || [],
        backgroundColor: '#FF6384',
      }],
    };
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  return (
    <div className="reports-container">
      <h1 className="report-header">Reportes</h1>
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="date-label">Mes:</label>
          <select
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
          <label className="date-label">Año:</label>
          <select
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
      </div>

      {reportData.preventivos && (
        <div className="mb-8">
          <h2 className="report-header">Preventivos Resueltos/Asignados por Cuadrilla</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {generatePieChartData(reportData.preventivos, 'Preventivos').map((chartData, index) => (
              <div key={index} className="p-4 bg-white rounded shadow">
                <h3 className="text-center font-semibold">{chartData.title}</h3>
                <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
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
              {reportData.preventivos.map((item, index) => (
                <tr key={index}>
                  <td>{item.nombre}</td>
                  <td>{item.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportData.correctivos && (
        <div className="mb-8">
          <h2 className="report-header">Correctivos Resueltos/Asignados por Cuadrilla</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {generatePieChartData(reportData.correctivos, 'Correctivos').map((chartData, index) => (
              <div key={index} className="p-4 bg-white rounded shadow">
                <h3 className="text-center font-semibold">{chartData.title}</h3>
                <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
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
              {reportData.correctivos.map((item, index) => (
                <tr key={index}>
                  <td>{item.nombre}</td>
                  <td>{item.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportData.rubros && (
        <div className="mb-8">
          <h2 className="report-header">Días Promedio Correctivos por Rubro</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Rubro</th>
                <th>Promedio Días</th>
                <th>Cantidad Resueltos</th>
              </tr>
            </thead>
            <tbody>
              {reportData.rubros.rubros.map((item, index) => (
                <tr key={index}>
                  <td>{item.rubro}</td>
                  <td>{item.avgDays}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total General</td>
                <td>{reportData.rubros.totalAvgDays}</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {reportData.zonas && (
        <div className="mb-8">
          <h2 className="report-header">Correctivos por Zona</h2>
          <div className="p-4 bg-white rounded shadow mb-4">
            <h3 className="text-center font-semibold">Total Correctivos por Zona</h3>
            <Bar data={generateZonaBarChartData()} options={{ responsive: true, plugins: { legend: { display: false } } }} />
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
              {reportData.zonas.map((item, index) => (
                <tr key={index}>
                  <td>{item.zona}</td>
                  <td>{item.totalCorrectivos}</td>
                  <td>{item.avgCorrectivos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportData.sucursales && (
        <div className="mb-8">
          <h2 className="report-header">Correctivos por Sucursal</h2>
          <div className="p-4 bg-white rounded shadow mb-4">
            <h3 className="text-center font-semibold">Total Correctivos por Sucursal</h3>
            <Bar data={generateSucursalBarChartData()} options={{ responsive: true, plugins: { legend: { display: false } } }} />
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
              {reportData.sucursales.map((item, index) => (
                <tr key={index}>
                  <td>{item.sucursal}</td>
                  <td>{item.zona}</td>
                  <td>{item.totalCorrectivos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reportes;