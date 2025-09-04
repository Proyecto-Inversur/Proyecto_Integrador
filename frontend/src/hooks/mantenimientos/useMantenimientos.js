import { useState } from 'react';

const useMantenimientos = (sucursales = [], cuadrillas = [], isSelected, setIsSelected, addToRoute, removeFromRoute) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const toggleRoute = () => {
    if (isSelected) {
      setIsSelected(false);
      removeFromRoute();
    } else {
      setIsSelected(true);
      addToRoute();
    }
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

  return {
    showModal,
    selectedImage,
    handleImageClick,
    handleCloseModal,
    toggleRoute,
    getSucursalNombre,
    getCuadrillaNombre,
    getZonaNombre,
    formatExtendido,
  };
};

export default useMantenimientos;