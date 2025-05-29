import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import CuadrillaForm from '../../src/components/CuadrillaForm';
import * as cuadrillaService from '../../src/services/cuadrillaService';
import * as zonaService from '../../src/services/zonaService';
import { vi } from 'vitest';
import { AuthContext } from '../../src/context/AuthContext';
import userEvent from '@testing-library/user-event';

// Mock de react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(), // Mock de useNavigate
}));

// Mock de firebase.js al inicio para asegurar que se aplique antes de cualquier importación
vi.mock('../../src/services/firebase', () => {
  const mockUser = {
    uid: 'mock-user-id',
    email: 'test@example.com',
    getIdToken: vi.fn().mockResolvedValue('mock-token'),
  };

  return {
    auth: {
      currentUser: null, // Simula que no hay usuario logueado inicialmente
    },
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
      callback(null); // Simula que no hay usuario logueado inicialmente
      return () => {}; // Simula la función de unsubscribe
    }),
    GoogleAuthProvider: vi.fn(() => ({})),
    signInWithPopup: vi.fn().mockResolvedValue({
      user: mockUser,
    }),
    linkWithPopup: vi.fn(),
  };
});

// Mock de servicios
vi.mock('../../src/services/cuadrillaService');
vi.mock('../../src/services/zonaService');
vi.mock('../../src/services/api');

// Mock para signInWithGoogleForRegistration
const mockSignInWithGoogleForRegistration = vi.fn().mockResolvedValue({
  idToken: 'mock-token',
  email: 'test@example.com',
});

describe('CuadrillaForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    zonaService.getZonas.mockResolvedValue({ data: [{ id: 1, nombre: 'Nueva Cordoba' }] });
  });

  // Renderizar dentro de un proveedor de contexto mockeado
  const renderWithContext = (component) => {
    return render(
      <AuthContext.Provider
        value={{
          signInWithGoogleForRegistration: mockSignInWithGoogleForRegistration,
          currentUser: null,
          currentEntity: null,
          loading: false,
          verifying: false,
          verifyUser: vi.fn(),
        }}
      >
        {component}
      </AuthContext.Provider>
    );
  };

  test('renders create form correctly with initial state', async () => {
    renderWithContext(<CuadrillaForm onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Crear Cuadrilla/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
      expect(screen.getByText(/Seleccione una zona/i)).toBeInTheDocument();
      const registerButton = screen.getByText(/Registrar con Google/i);
      expect(registerButton).toBeDisabled();
    });
  });

  test('renders edit form with pre-filled data', async () => {
    const mockCuadrilla = { id: 1, nombre: 'Cuadrilla 1', zona: 'Nueva Cordoba' };
    renderWithContext(<CuadrillaForm cuadrilla={mockCuadrilla} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Editar Cuadrilla/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nombre/i)).toHaveValue('Cuadrilla 1');
      expect(screen.getByText(/Nueva Cordoba/i)).toBeInTheDocument();
    });
  });

  test('submits create form successfully', async () => {
    cuadrillaService.createCuadrilla.mockResolvedValue();
    renderWithContext(<CuadrillaForm onClose={mockOnClose} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Cuadrilla 1' } });
      await userEvent.click(screen.getByText(/Seleccione una zona/i).closest('button')); // Abre el dropdown

      // Espera a que el dropdown se abra y muestre las opciones
      await waitFor(() => {
        expect(screen.getByText('+ Agregar nueva zona...')).toBeInTheDocument();
      });

      // Selecciona la primera zona disponible (en este caso, "Nueva Cordoba")
      await userEvent.click(screen.getByText('Nueva Cordoba'));
      await userEvent.click(screen.getByText(/Registrar con Google/i));
    });

    await waitFor(() => {
      expect(mockSignInWithGoogleForRegistration).toHaveBeenCalled();
      expect(cuadrillaService.createCuadrilla).toHaveBeenCalledWith({
        nombre: 'Cuadrilla 1',
        zona: 'Nueva Cordoba',
        email: 'test@example.com',
        id_token: 'mock-token',
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('deletes a zona', async () => {
    zonaService.deleteZona.mockResolvedValue();
    renderWithContext(<CuadrillaForm onClose={mockOnClose} />);

    await act(async () => {
      await userEvent.click(screen.getByText(/Seleccione una zona/i).closest('button')); // Abre el dropdown

      // Espera a que el dropdown se abra y muestre las opciones
      await waitFor(() => {
        expect(screen.getByText('+ Agregar nueva zona...')).toBeInTheDocument();
      });

      // Obtiene la primera zona y busca el botón de eliminación
      const zonaItem = screen.getByText('Nueva Cordoba').closest('.dropdown-item');
      const deleteButton = zonaItem.querySelector('button.custom-delete-button');

      if (!deleteButton) {
        console.log('No se encontró el botón de eliminación. Estructura del zonaItem:', zonaItem.outerHTML);
        throw new Error('El botón de eliminación con clase custom-delete-button no se encontró en el DOM.');
      }

      await userEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(zonaService.deleteZona).toHaveBeenCalledWith(1);
    });
  });

  test('adds a new zona', async () => {
    zonaService.createZona.mockResolvedValue({ data: { id: 2, nombre: 'Nueva Zona' } });
    renderWithContext(<CuadrillaForm onClose={mockOnClose} />);

    await act(async () => {
      await userEvent.click(screen.getByText(/Seleccione una zona/i).closest('button')); // Abre el dropdown

      // Espera a que el dropdown se abra y muestre la opción "Agregar nueva zona..."
      await waitFor(() => {
        expect(screen.getByText('Agregar nueva zona...')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Agregar nueva zona...')); // Abre el campo para nueva zona

      // Asegura que el campo de entrada esté presente antes de interactuar
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Escriba la nueva zona/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText(/Escriba la nueva zona/i), { target: { value: 'Nueva Zona' } });

      // Usa un selector más específico para el botón "Agregar"
      const addButton = screen.getByText('Agregar', { selector: 'button.custom-add-button' });
      await userEvent.click(addButton);
    });

    await waitFor(() => {
      expect(zonaService.createZona).toHaveBeenCalledWith({ nombre: 'Nueva Zona' });
      expect(screen.getByText(/Nueva Zona/i)).toBeInTheDocument();
    });
  });
});