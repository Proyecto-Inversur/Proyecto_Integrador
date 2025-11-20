describe('Modulo de Mantenimientos Correctivos - Integracion', () => {
  const adminEntity = {
    type: 'usuario',
    data: {
      id: 1,
      uid: 'test-uid',
      nombre: 'Test User',
      email: 'test@example.com',
      rol: 'Administrador',
    },
  };

  const setSession = (win) => {
    const token = 'e2e-token';
    win.localStorage.setItem('authToken', token);
    win.sessionStorage.setItem('authToken', token);
    win.localStorage.setItem('currentEntity', JSON.stringify(adminEntity));
    win.sessionStorage.setItem('currentEntity', JSON.stringify(adminEntity));
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then(() => {});
  });

  it('carga la pagina y crea, edita y elimina un mantenimiento correctivo', () => {
    const baseCase = 'TEST-CASE-001';
    const updatedCase = 'TEST-CASE-002';
    const baseIncident = 'Fuga de agua';
    const updatedIncident = 'Rotura de vidrio';
    const baseRubro = 'Sanitarios';
    const updatedRubro = 'Aberturas/Vidrios';

    cy.visit('/mantenimientos-correctivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Mantenimientos Correctivos/i, { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Agregar', { timeout: 30000 }).should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');

    cy.get('#cliente_id', { timeout: 30000 }).select('Cliente E2E');
    cy.get('#id_sucursal', { timeout: 30000 }).select('Sucursal E2E');
    cy.get('#id_cuadrilla', { timeout: 30000 }).select('Cuadrilla E2E');
    cy.get('#fecha_apertura').clear().type('2025-01-01');
    cy.get('#numero_caso').clear().type(baseCase);
    cy.get('#incidente').clear().type(baseIncident);
    cy.get('#rubro', { timeout: 30000 }).select(baseRubro);
    cy.get('#estado', { timeout: 30000 }).select('Pendiente');
    cy.get('#prioridad', { timeout: 30000 }).select('Media');

    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('td', 'Cliente E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'Sucursal E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'Cuadrilla E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('td', baseCase, { timeout: 30000 }).should('be.visible');
    cy.contains('td', baseIncident, { timeout: 30000 }).should('be.visible');
    cy.contains('td', baseRubro, { timeout: 30000 }).should('be.visible');

    cy.contains('tr', 'Cliente E2E', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible')

    cy.get('#numero_caso').clear().type(updatedCase);
    cy.get('#incidente').clear().type(updatedIncident);
    cy.get('#rubro', { timeout: 30000 }).select(updatedRubro);

    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('td', 'Cliente E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'Sucursal E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'Cuadrilla E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('td', updatedCase, { timeout: 30000 }).should('be.visible');
    cy.contains('td', updatedIncident, { timeout: 30000 }).should('be.visible');
    cy.contains('td', updatedRubro, { timeout: 30000 }).should('be.visible');

    cy.contains('tr', 'Cliente E2E', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.wait(5000);
    cy.contains('td', 'Cliente E2E', { timeout: 30000 }).should('not.exist');

    cy.contains('button', 'Agregar', { timeout: 30000 }).should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');

    cy.get('#cliente_id', { timeout: 30000 }).select('Cliente E2E');
    cy.get('#id_sucursal', { timeout: 30000 }).select('Sucursal E2E');
    cy.get('#id_cuadrilla', { timeout: 30000 }).select('Cuadrilla E2E');
    cy.get('#fecha_apertura').clear().type('2025-01-01');
    cy.get('#numero_caso').clear().type(baseCase);
    cy.get('#incidente').clear().type(baseIncident);
    cy.get('#rubro', { timeout: 30000 }).select(baseRubro);
    cy.get('#estado', { timeout: 30000 }).select('Pendiente');
    cy.get('#prioridad', { timeout: 30000 }).select('Media');

    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();
    cy.wait(5000);
  });

  it('aplica filtros sobre los mantenimientos correctivos', () => {
    cy.visit('/mantenimientos-correctivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Mantenimientos Correctivos/i, { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Filtros', { timeout: 30000 }).should('be.visible').click();

    cy.get('select[name="cuadrilla"]', { timeout: 30000 }).select('Cuadrilla E2E');
    cy.get('table tbody tr', { timeout: 30000 }).should('have.length', 1);
    cy.get('select[name="cuadrilla"]', { timeout: 30000 }).select('');

    cy.get('select[name="cliente"]', { timeout: 30000 }).select('Cliente E2E');
    cy.get('table tbody tr', { timeout: 30000 }).should('have.length', 1);
    cy.get('select[name="cliente"]', { timeout: 30000 }).select('');

    cy.get('select[name="sucursal"]', { timeout: 30000 }).select('Sucursal E2E');
    cy.get('table tbody tr', { timeout: 30000 }).should('have.length', 1);
    cy.get('select[name="sucursal"]', { timeout: 30000 }).select('');

    cy.get('select[name="zona"]', { timeout: 30000 }).select('Zona E2E');
    cy.get('table tbody tr', { timeout: 30000 }).should('have.length', 1);
    cy.get('select[name="zona"]', { timeout: 30000 }).select('');
  });

  it('permite ocultar columnas mediante el selector', () => {
    cy.visit('/mantenimientos-correctivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Mantenimientos Correctivos/i, { timeout: 30000 }).should('be.visible');
    cy.get('table thead th', { timeout: 30000 }).should('contain', 'ID');

    cy.get('button[aria-label="Seleccionar columnas"]', { timeout: 30000 }).click();

    cy.get('.column-selector-modal', { timeout: 30000 }).should('be.visible');
    cy.get('input#col-id', { timeout: 30000 }).should('be.checked').uncheck({ force: true });
    cy.contains('button', 'Guardar', { timeout: 30000 }).click();

    cy.get('table thead th', { timeout: 30000 }).should(($ths) => {
      const texts = Array.from($ths, (th) => th.innerText.trim());
      expect(texts).to.not.include('ID');
    });

    cy.get('button[aria-label="Seleccionar columnas"]', { timeout: 30000 }).click();

    cy.get('.column-selector-modal', { timeout: 30000 }).should('be.visible');
    cy.get('input#col-id', { timeout: 30000 }).check();
    cy.contains('button', 'Guardar', { timeout: 30000 }).click();
  });
});
