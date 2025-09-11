import React, { useState, useEffect } from 'react';
import { getCuadrillas } from '../services/cuadrillaService';
import { getMantenimientosCorrectivos } from '../services/mantenimientoCorrectivoService';
import { getMantenimientosPreventivos } from '../services/mantenimientoPreventivoService';
import { getSucursales } from '../services/sucursalService';
import { getZonas } from '../services/zonaService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoImg from '../assets/logo_inversur.png';

const useReportes = () => {
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
    return items.filter(item => {
      const rawDate = item[dateField];
      if (!rawDate) return false;

      const date = new Date(rawDate);
      if (isNaN(date)) return false;

      const matchesMonth = month ? date.getMonth() + 1 === parseInt(month) : true;
      const matchesYear = year ? date.getFullYear() === parseInt(year) : true;

      return matchesMonth && matchesYear;
    });
  };

  const generatePreventivoReport = () => {
    const filteredPreventivos = filterByMonthYear(preventivos, 'fecha_apertura');
    return cuadrillas.map(cuadrilla => {
      const asignados = filteredPreventivos.filter(p => p.id_cuadrilla === cuadrilla.id).length;
      const resueltos = filteredPreventivos.filter(p => p.id_cuadrilla === cuadrilla.id && p.fecha_cierre).length;
      return {
        nombre: cuadrilla.nombre,
        ratio: asignados ? (resueltos / asignados).toFixed(2) : 0,
        resueltos,
        asignados,
      };
    });
  };

  const generateCorrectivoReport = () => {
    const filteredCorrectivos = filterByMonthYear(correctivos, 'fecha_apertura');
    return cuadrillas.map(cuadrilla => {
      const asignados = filteredCorrectivos.filter(c => c.id_cuadrilla === cuadrilla.id).length;
      const resueltos = filteredCorrectivos.filter(c => c.id_cuadrilla === cuadrilla.id && c.estado === 'Finalizado').length;
      return {
        nombre: cuadrilla.nombre,
        ratio: asignados ? (resueltos / asignados).toFixed(2) : 0,
        resueltos,
        asignados,
      };
    });
  };

  const generateRubroReport = () => {
    const filtered = filterByMonthYear(correctivos.filter(c => c.estado === 'Finalizado'), 'fecha_apertura');
    const rubros = [...new Set(filtered.map(c => c.rubro))];
    const report = rubros.map(rubro => {
      const items = filtered.filter(c => c.rubro === rubro);
      const days = items.map(c => (new Date(c.fecha_cierre) - new Date(c.fecha_apertura)) / (1000 * 60 * 60 * 24));
      const avgDays = days.length ? (days.reduce((a, b) => a + b, 0) / days.length).toFixed(2) : 0;
      return { rubro, avgDays, count: items.length };
    });
    const totalAvgDays = filtered.length
      ? (filtered.reduce((sum, c) => sum + (new Date(c.fecha_cierre) - new Date(c.fecha_apertura)) / (1000 * 60 * 60 * 24), 0) / filtered.length).toFixed(2)
      : 0;
    const totalCount = filtered.length;

    return { rubros: report, totalAvgDays, totalCount };
  };

  const generateZonaReport = () => {
    const filtered = filterByMonthYear(correctivos, 'fecha_apertura');
    return zonas.map(zona => {
      const sucZona = sucursales.filter(s => s.zona === zona.nombre);
      const corrZona = filtered.filter(c => sucZona.some(s => s.id === c.id_sucursal));
      const avg = sucZona.length ? (corrZona.length / sucZona.length).toFixed(2) : 0;
      return { zona: zona.nombre, totalCorrectivos: corrZona.length, avgCorrectivos: avg };
    });
  };

  const generateSucursalReport = () => {
    const filtered = filterByMonthYear(correctivos, 'fecha_apertura');
    return sucursales.map(sucursal => {
      const count = filtered.filter(c => c.id_sucursal === sucursal.id).length;
      return { sucursal: sucursal.nombre, zona: sucursal.zona, totalCorrectivos: count };
    });
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
      }],
      title: `${type} - ${item.nombre}`,
    }));
  };

  const generateBarChartData = (items, label, key) => ({
    labels: items.map(i => i[label]),
    datasets: [{
      label: 'Total Correctivos',
      data: items.map(i => i[key]),
      backgroundColor: '#FF6384',
    }],
  });

  const months = [...Array(12)].map((_, i) => ({ value: `${i + 1}`, label: new Date(0, i).toLocaleString('es-AR', { month: 'long' }) }));
  const years = [...Array(10)].map((_, i) => new Date().getFullYear() - i);

  const handleDownloadReport = async () => {
    const reportElement = document.querySelector('.reports-container');

    if (!reportElement) {
      alert('No se encontró el contenido del reporte.');
      return;
    }

    const canvas = await html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY, // para capturar correctamente desde el top
    });

    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginTop = 28;  // Espacio para navbar/logo
    const marginBottom = 10; // Espacio inferior
    const usableHeight = pageHeight - marginTop - marginBottom - 3;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const canvasToPDFRatio = canvas.height / imgHeight;
    const pageCanvasHeight = usableHeight * canvasToPDFRatio;

    const overlapPx = 50; // cantidad de píxeles para superposición entre páginas
    const totalPages = Math.ceil((canvas.height - overlapPx) / (pageCanvasHeight - overlapPx));

    let currentYOffset;

    if (window.innerWidth > 1024) {
      currentYOffset = canvas.height * 0.035; // offset para PC
    } else {
      currentYOffset = 0; // offset para móvil/tablet
    }

    for (let page = 0; page < totalPages; page++) {
      const pageCanvas = document.createElement('canvas');
      const context = pageCanvas.getContext('2d');

      pageCanvas.width = canvas.width;
      pageCanvas.height = pageCanvasHeight;

      context.drawImage(
        canvas,
        0, currentYOffset,
        canvas.width, pageCanvasHeight,
        0, 0,
        canvas.width, pageCanvasHeight
      );

      const pageImgData = pageCanvas.toDataURL('image/png');

      if (page > 0) pdf.addPage();

      // Barra superior
      pdf.setFillColor('#2c2c2c');
      pdf.rect(0, 0, pageWidth, marginTop - 3, 'F');

      // Logo centrado
      const logoWidth = 33.33;
      const logoHeight = 15;
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = 5;

      pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);

      // Imagen de contenido
      pdf.addImage(
        pageImgData,
        'PNG',
        0,
        marginTop,
        imgWidth,
        usableHeight
      );

      // Barra inferior
      pdf.setFillColor('#2c2c2c');
      pdf.rect(0, pageHeight - marginBottom, pageWidth, marginBottom, 'F');

      // Aumentar el offset para la siguiente página, aplicando superposición
      currentYOffset += pageCanvasHeight - overlapPx;
    }

    const now = new Date();
    const fileName = `Reporte_${now.toLocaleDateString().replace(/\//g, '-')}_${now.toLocaleTimeString().replace(/:/g, '-')}.pdf`;
    pdf.save(fileName);
  };

  return { 
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
  };
};

export default useReportes;