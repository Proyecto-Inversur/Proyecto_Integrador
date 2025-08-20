import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Mantenimiento from '../../src/pages/Mantenimiento';
import { BrowserRouter } from 'react-router-dom';

describe('Mantenimiento component', () => {
  test('renderiza los botones de navegación', () => {
    render(
      <BrowserRouter>
        <Mantenimiento />
      </BrowserRouter>
    );

    const buttons = [
      'Cuadrillas',
      'Sucursales',
      'Preventivos',
      'Mantenimiento Correctivo',
      'Mantenimiento Preventivo',
    ];

    buttons.forEach((buttonText) => {
      expect(screen.getByText(buttonText)).toBeInTheDocument();
    });
  });
});
