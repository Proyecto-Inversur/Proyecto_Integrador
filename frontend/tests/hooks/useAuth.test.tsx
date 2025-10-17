import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

// ====== Mocks ======
// Ajustá las rutas según tu proyecto (aquí se asume src/...)
vi.mock('../../src/services/api', () => ({
  default: { post: vi.fn() },
}));

// Crear spies compartidos para que el hook y el test usen los mismos
const subscribeSpy = vi.fn().mockResolvedValue(undefined);
const unsubscribeSpy = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/hooks/usePushSubscription', () => {
  return {
    __esModule: true,
    default: () => ({
      subscription: null,
      subscribe: subscribeSpy,
      unsubscribe: unsubscribeSpy,
    }),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Importar AFTER mocks
import useAuth, { buildUserAuthError } from '../../src/hooks/useAuth';
import api from '../../src/services/api';
import usePushSubscription from '../../src/hooks/usePushSubscription';

// Componente de prueba que expone el hook
function TestComponent() {
  const {
    currentEntity,
    loading,
    verifying,
    singingIn,
    verifyUser,
    logOut,
    retrySignIn,
    startSigningIn,
    stopSigningIn,
    subscription,
  } = useAuth();

  return (
    <div>
      <div data-testid="currentEntity">
        {currentEntity ? JSON.stringify(currentEntity) : 'null'}
      </div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="verifying">{String(verifying)}</div>
      <div data-testid="singingIn">{String(singingIn)}</div>
      <div data-testid="subscription">{String(!!subscription)}</div>

      <button onClick={() => startSigningIn()}>startSigningIn</button>
      <button onClick={() => stopSigningIn()}>stopSigningIn</button>

      <button
        onClick={async () => {
          await verifyUser('FAKE_TOKEN');
        }}
      >
        verifyUser
      </button>

      <button
        onClick={async () => {
          await logOut('test-error');
        }}
      >
        logOut
      </button>

      <button
        onClick={async () => {
          await retrySignIn();
        }}
      >
        retrySignIn
      </button>
    </div>
  );
}

describe('useAuth (UI-only tests)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockNavigate.mockClear();
    // limpiar spies manualmente por si acaso
    subscribeSpy.mockClear();
    unsubscribeSpy.mockClear();
  });

  it('lee currentEntity inicial desde localStorage', () => {
    const entity = { id: 1, name: 'Test' };
    localStorage.setItem('currentEntity', JSON.stringify(entity));

    render(<TestComponent />);

    expect(screen.getByTestId('currentEntity').textContent).toBe(JSON.stringify(entity));
  });

  it('start/stop signing togglean singingIn', () => {
    render(<TestComponent />);
    const startBtn = screen.getByText('startSigningIn');
    const stopBtn = screen.getByText('stopSigningIn');

    expect(screen.getByTestId('singingIn').textContent).toBe('false');

    act(() => fireEvent.click(startBtn));
    expect(screen.getByTestId('singingIn').textContent).toBe('true');

    act(() => fireEvent.click(stopBtn));
    expect(screen.getByTestId('singingIn').textContent).toBe('false');
  });

  it('verifyUser éxito: setea currentEntity, storage y llama subscribe', async () => {
    const fakeResponse = {
      data: {
        data: { uid: 'uid-123' },
        name: 'Juan',
      },
    };
    (api.post as any).mockResolvedValueOnce(fakeResponse);

    render(<TestComponent />);
    const verifyBtn = screen.getByText('verifyUser');

    await act(async () => {
      await fireEvent.click(verifyBtn);
    });

    // estados
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('verifying').textContent).toBe('false');

    // currentEntity y storage
    expect(screen.getByTestId('currentEntity').textContent).toBe(JSON.stringify(fakeResponse.data));
    expect(localStorage.getItem('authToken')).toBe('FAKE_TOKEN');
    expect(sessionStorage.getItem('authToken')).toBe('FAKE_TOKEN');
    expect(localStorage.getItem('currentEntity')).toBe(JSON.stringify(fakeResponse.data));
    expect(sessionStorage.getItem('currentEntity')).toBe(JSON.stringify(fakeResponse.data));

    // ahora sí: subscribeSpy fue llamado por el hook con el uid correcto
    expect(subscribeSpy).toHaveBeenCalledWith('uid-123');
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('logOut limpia storage y navega a /login con state si hay error', async () => {
    localStorage.setItem('authToken', 'x');
    localStorage.setItem('currentEntity', JSON.stringify({ name: 'X' }));

    render(<TestComponent />);
    const logoutBtn = screen.getByText('logOut');

    await act(async () => {
      await fireEvent.click(logoutBtn);
    });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('currentEntity')).toBeNull();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('retrySignIn sin token no hace nada', async () => {
    localStorage.removeItem('googleIdToken');
    sessionStorage.removeItem('googleIdToken');

    render(<TestComponent />);
    const retryBtn = screen.getByText('retrySignIn');

    await act(async () => {
      await fireEvent.click(retryBtn);
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  describe('buildUserAuthError', () => {
    it('mensajes friendly y fallback', () => {
      const err401 = { response: { status: 401, data: { detail: 'x' } } };
      expect(buildUserAuthError(err401 as any)).toBe('No se pudo validar tu sesión. Volvé a iniciar sesión.');
      const unknown = { message: 'boom' };
      expect(buildUserAuthError(unknown as any, 'fallback-msg')).toBe('fallback-msg');
    });
  });
});
