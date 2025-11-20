import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCuadrillas } from '../services/cuadrillaService';
import { getMantenimientosCorrectivos } from '../services/mantenimientoCorrectivoService';
import { getMantenimientosPreventivos } from '../services/mantenimientoPreventivoService';
import { getSucursales } from '../services/sucursalService';
import { getZonas } from '../services/zonaService';
import { getClientes } from '../services/clienteService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoImg from '../assets/logo_inversur.png';

const useEstadisticas = () => {
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [correctivos, setCorrectivos] = useState([]);
  const [preventivos, setPreventivos] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [estadisticasData, setEstadisticasData] = useState({});
  const [clientes, setClientes] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [
          cuadrillasRes,
          correctivosRes,
          preventivosRes,
          zonasRes,
          sucursalesRes,
          clientesRes,
        ] = await Promise.all([
          getCuadrillas(),
          getMantenimientosCorrectivos(),
          getMantenimientosPreventivos(),
          getZonas(),
          getSucursales(),
          getClientes(),
        ]);
        setCuadrillas(cuadrillasRes.data);
        setCorrectivos(correctivosRes.data);
        setPreventivos(preventivosRes.data);
        setZonas(zonasRes.data);
        setSucursales(sucursalesRes.data);
        setClientes(clientesRes.data || []);
      } catch (error) {
        console.error('Error al cargar datos de estadísticas', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const sucursalMap = useMemo(() => {
    const map = {};
    sucursales.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [sucursales]);

  const filterByMonthYear = useCallback((items, dateField) => {
    return items.filter(item => {
      const rawDate = item[dateField];
      if (!rawDate) return false;

      const date = new Date(rawDate);
      if (isNaN(date)) return false;

      const monthValue = `${date.getMonth() + 1}`;
      const yearValue = `${date.getFullYear()}`;
      const matchesMonth = selectedMonths.length ? selectedMonths.includes(monthValue) : true;
      const matchesYear = selectedYears.length ? selectedYears.includes(yearValue) : true;

      return matchesMonth && matchesYear;
    });
  }, [selectedMonths, selectedYears]);

  const applyFilters = useCallback((items, filters = {}, dateField = 'fecha_apertura') => {
    let filtered = filterByMonthYear(items, dateField);
    const {
      cliente: clienteFilter,
      zona: zonaFilter,
      sucursal: sucursalFilter,
      cuadrilla: cuadrillaFilter,
      estado: estadoFilter,
    } = filters;

    if (clienteFilter) {
      filtered = filtered.filter((item) => {
        const sucursal = sucursalMap[item.id_sucursal];
        return sucursal && String(sucursal.cliente_id) === clienteFilter;
      });
    }
    if (zonaFilter) {
      filtered = filtered.filter((item) => {
        const sucursal = sucursalMap[item.id_sucursal];
        return sucursal?.zona === zonaFilter;
      });
    }
    if (sucursalFilter) {
      filtered = filtered.filter((item) => String(item.id_sucursal) === sucursalFilter);
    }
    if (cuadrillaFilter) {
      filtered = filtered.filter((item) => String(item.id_cuadrilla) === cuadrillaFilter);
    }
    if (estadoFilter) {
      filtered = filtered.filter((item) => item.estado === estadoFilter);
    }
    return filtered;
  }, [filterByMonthYear, sucursalMap]);

  const generatePreventivoReport = useCallback((filters = {}) => {
    const filteredPreventivos = applyFilters(preventivos, filters, 'fecha_apertura');
    if (filteredPreventivos.length === 0) return [];

    const targetCuadrillas = filters.cuadrilla
      ? cuadrillas.filter((cuadrilla) => String(cuadrilla.id) === filters.cuadrilla)
      : cuadrillas.filter((cuadrilla) => filteredPreventivos.some((p) => p.id_cuadrilla === cuadrilla.id));

    return targetCuadrillas
      .map((cuadrilla) => {
        const asignados = filteredPreventivos.filter((p) => p.id_cuadrilla === cuadrilla.id).length;
        if (asignados === 0) {
          return null;
        }
        const resueltos = filteredPreventivos.filter((p) => p.id_cuadrilla === cuadrilla.id && p.fecha_cierre).length;
        return {
          nombre: cuadrilla.nombre,
          ratio: asignados ? (resueltos / asignados).toFixed(2) : 0,
          resueltos,
          asignados,
        };
      })
      .filter(Boolean);
  }, [applyFilters, cuadrillas, preventivos]);

  const generateCorrectivoReport = useCallback((filters = {}) => {
    const filteredCorrectivos = applyFilters(correctivos, filters, 'fecha_apertura');
    if (filteredCorrectivos.length === 0) return [];

    const targetCuadrillas = filters.cuadrilla
      ? cuadrillas.filter((cuadrilla) => String(cuadrilla.id) === filters.cuadrilla)
      : cuadrillas.filter((cuadrilla) => filteredCorrectivos.some((c) => c.id_cuadrilla === cuadrilla.id));

    return targetCuadrillas
      .map((cuadrilla) => {
        const asignados = filteredCorrectivos.filter((c) => c.id_cuadrilla === cuadrilla.id).length;
        if (asignados === 0) {
          return null;
        }
        const resueltos = filteredCorrectivos.filter((c) => c.id_cuadrilla === cuadrilla.id && c.estado === 'Finalizado').length;
        return {
          nombre: cuadrilla.nombre,
          ratio: asignados ? (resueltos / asignados).toFixed(2) : 0,
          resueltos,
          asignados,
        };
      })
      .filter(Boolean);
  }, [applyFilters, cuadrillas, correctivos]);

  const generateRubroReport = useCallback((filters = {}) => {
    const filtered = applyFilters(
      correctivos.filter((c) => c.estado === 'Finalizado'),
      filters,
      'fecha_apertura'
    );
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
  }, [applyFilters, correctivos]);

  const generateZonaReport = useCallback((filters = {}) => {
    const filtered = applyFilters(correctivos, filters, 'fecha_apertura');
    if (filtered.length === 0) return [];

    const zoneMap = new Map();

    filtered.forEach((item) => {
      const sucursal = sucursalMap[item.id_sucursal];
      if (!sucursal) return;
      const zoneName = sucursal.zona || 'Sin zona';

      if (!zoneMap.has(zoneName)) {
        const relevantSucursales = sucursales.filter((s) => {
          if (s.zona !== zoneName) return false;
          if (filters.cliente && String(s.cliente_id) !== filters.cliente) return false;
          if (filters.sucursal && String(s.id) !== filters.sucursal) return false;
          return true;
        });

        zoneMap.set(zoneName, {
          zona: zoneName,
          totalCorrectivos: 0,
          sucursalesCount: relevantSucursales.length || 1,
        });
      }

      const entry = zoneMap.get(zoneName);
      entry.totalCorrectivos += 1;
    });

    if (filters.zona) {
      const filteredZone = zoneMap.get(filters.zona);
      return filteredZone
        ? [{
          zona: filteredZone.zona,
          totalCorrectivos: filteredZone.totalCorrectivos,
          avgCorrectivos: (filteredZone.totalCorrectivos / filteredZone.sucursalesCount).toFixed(2),
        }]
        : [];
    }

    return Array.from(zoneMap.values()).map((entry) => ({
      zona: entry.zona,
      totalCorrectivos: entry.totalCorrectivos,
      avgCorrectivos: (entry.totalCorrectivos / entry.sucursalesCount).toFixed(2),
    }));
  }, [applyFilters, correctivos, sucursalMap, sucursales]);

  const generateSucursalReport = useCallback((filters = {}) => {
    const filtered = applyFilters(correctivos, filters, 'fecha_apertura');
    if (filtered.length === 0) return [];

    const totals = {};

    filtered.forEach((item) => {
      const sucursal = sucursalMap[item.id_sucursal];
      if (!sucursal) return;

      if (!totals[sucursal.id]) {
        totals[sucursal.id] = {
          sucursal: sucursal.nombre,
          zona: sucursal.zona,
          totalCorrectivos: 0,
        };
      }

      totals[sucursal.id].totalCorrectivos += 1;
    });

    return Object.values(totals);
  }, [applyFilters, correctivos, sucursalMap]);

  const handleGenerateEstadisticas = useCallback((filtersBySection = {}) => {
    if (isLoadingData) {
      return;
    }

    const normalizedFilters = {
      preventivos: filtersBySection.preventivos || {},
      correctivos: filtersBySection.correctivos || {},
      rubros: filtersBySection.rubros || {},
      zonas: filtersBySection.zonas || {},
      sucursales: filtersBySection.sucursales || {},
    };

    setEstadisticasData({
      preventivos: generatePreventivoReport(normalizedFilters.preventivos),
      correctivos: generateCorrectivoReport(normalizedFilters.correctivos),
      rubros: generateRubroReport(normalizedFilters.rubros),
      zonas: generateZonaReport(normalizedFilters.zonas),
      sucursales: generateSucursalReport(normalizedFilters.sucursales),
    });
  }, [
    generatePreventivoReport,
    generateCorrectivoReport,
    generateRubroReport,
    generateZonaReport,
    generateSucursalReport,
    isLoadingData,
  ]);

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

  const months = useMemo(
    () => [...Array(12)].map((_, i) => ({ value: `${i + 1}`, label: new Date(0, i).toLocaleString('es-AR', { month: 'long' }) })),
    []
  );

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2020 + 1 }, (_, i) => `${currentYear - i}`);
  }, []);

  useEffect(() => {
    setSelectedMonths(months.map((m) => m.value));
    setSelectedYears(years);
  }, [months, years]);

  const handleDownloadEstadisticas = async () => {
    const reportElement = document.querySelector('.reports-container');

    if (!reportElement) {
      alert('No se encontró el contenido de las estadísticas.');
      return;
    }

    const canvas = await html2canvas(reportElement, {
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
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
      currentYOffset = canvas.height * 0.025; // offset para PC
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
    const fileName = `Estadisticas_${now.toLocaleDateString().replace(/\//g, '-')}_${now.toLocaleTimeString().replace(/:/g, '-')}.pdf`;
    pdf.save(fileName);
  };

  return { 
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
    handleDownloadEstadisticas
  };
};

export default useEstadisticas;
