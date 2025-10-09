describe('Modulo de Ruta - Integracion', () => {
  let cuadrillaId;

  before(() => {
    cy.readFile('cypress/fixtures/cuadrillaId.json').then((data) => {
      cuadrillaId = parseInt(data.id, 10);
    });
  });

  const setSession = (win, cuadrillaId) => {
    const adminEntity = {
        type: 'cuadrilla',
        data: {
            id: cuadrillaId,
            uid: 'test-uid',
            nombre: 'Cuadrilla E2E',
            zona: 'Zona E2E',
            email: 'test@example.com',
        },
    };

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

  it('Agrega un correctivo y un preventivo a la ruta actual', () => {
    cy.readFile('cypress/fixtures/cuadrillaId.json').then((data) => {
      const cuadrillaId = parseInt(data.id, 10);

      cy.visit('/mantenimientos-correctivos', {
        onBeforeLoad: (win) => {
          win.localStorage.clear();
          win.sessionStorage.clear();
          setSession(win, cuadrillaId);
        },
      });

      cy.contains(/Mantenimientos Correctivos/i, { timeout: 30000 }).should('be.visible');
      cy.contains('tr', 'Sucursal E2E', { timeout: 30000 }).click();
    });

    cy.contains('button', 'Agregar a la ruta actual').should('be.visible').click();
    cy.contains('.fade', 'Mantenimiento agregado a la ruta.', { timeout: 30000 }).should('be.visible');

    cy.readFile('cypress/fixtures/cuadrillaId.json').then((data) => {
      const cuadrillaId = parseInt(data.id, 10);

      cy.visit('/mantenimientos-preventivos', {
        onBeforeLoad: (win) => {
          win.localStorage.clear();
          win.sessionStorage.clear();
          setSession(win, cuadrillaId);
        },
      });

      cy.contains(/Mantenimientos Preventivos/i, { timeout: 30000 }).should('be.visible');
      cy.contains('tr', 'Sucursal E2E - Mensual', { timeout: 30000 }).click();
    });

    cy.contains('button', 'Agregar a la ruta actual').should('be.visible').click();
    cy.contains('.fade', 'Mantenimiento agregado a la ruta.', { timeout: 30000 }).should('be.visible');
  });

  it('Carga pagina de ruta con la ruta actual, centra en el usuario, inicia, detiene navegacion y borra la ruta', () => {
    cy.readFile('cypress/fixtures/cuadrillaId.json').then((data) => {
      const cuadrillaId = parseInt(data.id, 10);

      cy.visit('/ruta', {
        onBeforeLoad: (win) => {
          win.localStorage.clear();
          win.sessionStorage.clear();
          setSession(win, cuadrillaId);
        },
      });
    });

    cy.get('[stroke="#2c2c2c"]', { timeout: 30000 }).should('be.visible');
    
    cy.get('.leaflet-container')
    .trigger('mousedown', { which: 1, pageX: 200, pageY: 200 })
    .trigger('mousemove', { which: 1, pageX: 300, pageY: 300 })
    .trigger('mouseup', { force: true });

    cy.contains('button', 'Centrar').should('be.visible').click();
    cy.contains('button', 'Iniciar').should('be.visible').click();
    cy.contains('button', 'Detener').should('be.visible').click();

    cy.contains('button', 'Borrar ruta').should('be.visible').click();
    cy.get('[stroke="#2c2c2c"]', { timeout: 30000 }).should('not.exist');
  });
});
