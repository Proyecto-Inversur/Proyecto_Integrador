import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EncargadoPopup from '../../src/components/maps/EncargadoPopup';

// --- Mock de Datos ---
const mockEncargado = {
  name: 'Juan Pérez',
};

describe('EncargadoPopup', () => {

  it('debería renderizar el nombre del encargado y el badge correctamente', () => {
    // 1. Renderizamos el componente con el mock
    render(<EncargadoPopup encargado={mockEncargado} />);
    
    // 2. Verificamos que el nombre del encargado esté en el documento
    const nombreElement = screen.getByText('Juan Pérez');
    expect(nombreElement).toBeInTheDocument();
    
    // 3. Verificamos que el badge estático "Encargado" también se muestre
    const badgeElement = screen.getByText('Encargado');
    expect(badgeElement).toBeInTheDocument();
  });

});