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
    const baseCase = 'CASE-001';
    const updatedCase = 'CASE-002';
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
    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');

    cy.get('#id_sucursal').select('Sucursal E2E');
    cy.get('#id_cuadrilla').select('Cuadrilla E2E');
    cy.get('#fecha_apertura').clear().type('2024-03-01');
    cy.get('#numero_caso').clear().type(baseCase);
    cy.get('#incidente').clear().type(baseIncident);
    cy.get('#rubro').select(baseRubro);
    cy.get('#estado').select('Pendiente');
    cy.get('#prioridad').select('Media');

    cy.contains('button', 'Guardar').click();

    cy.contains('td', 'Sucursal E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'Cuadrilla E2E').should('be.visible');
    cy.contains('td', baseCase).should('be.visible');
    cy.contains('td', baseIncident).should('be.visible');
    cy.contains('td', baseRubro).should('be.visible');
    cy.contains('tr', 'Sucursal E2E').within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible')

    cy.get('#numero_caso').clear().type(updatedCase);
    cy.get('#incidente').clear().type(updatedIncident);
    cy.get('#rubro').select(updatedRubro);

    cy.contains('button', 'Guardar').click();

    cy.contains('td', 'Sucursal E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'Cuadrilla E2E').should('be.visible');
    cy.contains('td', updatedCase, { timeout: 30000 }).should('be.visible');
    cy.contains('td', updatedIncident).should('be.visible');
    cy.contains('td', updatedRubro).should('be.visible');

    cy.contains('tr', 'Sucursal E2E').within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });

    cy.contains('td', 'Sucursal E2E').should('not.exist');

    cy.contains('button', 'Agregar', { timeout: 30000 }).should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');

    cy.get('#id_sucursal').select('Sucursal E2E');
    cy.get('#id_cuadrilla').select('Cuadrilla E2E');
    cy.get('#fecha_apertura').clear().type('2024-03-01');
    cy.get('#numero_caso').clear().type(baseCase);
    cy.get('#incidente').clear().type(baseIncident);
    cy.get('#rubro').select(baseRubro);
    cy.get('#estado').select('Pendiente');
    cy.get('#prioridad').select('Media');

    cy.contains('button', 'Guardar').click();
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
    cy.contains('button', 'Filtros').should('be.visible').click();

    cy.get('select[name="cuadrilla"]').select('Cuadrilla E2E');
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('select[name="cuadrilla"]').select('');

    cy.get('select[name="sucursal"]').select('Sucursal E2E');
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('select[name="sucursal"]').select('');

    cy.get('select[name="zona"]').select('Zona E2E');
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('select[name="zona"]').select('');
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
    cy.get('table thead th').should('contain', 'ID');

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-id').should('be.checked').uncheck({ force: true });
    cy.contains('button', 'Guardar').click();

    cy.get('table thead th').should(($ths) => {
      const texts = Array.from($ths, (th) => th.innerText.trim());
      expect(texts).to.not.include('ID');
    });

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-id').check();
    cy.contains('button', 'Guardar').click();
  });
});
