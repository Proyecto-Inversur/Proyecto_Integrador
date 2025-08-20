import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Footer from '../../src/components/Footer';
import { BrowserRouter } from 'react-router-dom';

describe('Footer component', () => {
  test('renderiza el texto de derechos de autor', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Inversur App. Todos los derechos reservados.`)).toBeInTheDocument();
  });
});