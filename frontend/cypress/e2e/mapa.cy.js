describe('Módulo de Mapa - Integración con datos reales', () => {
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

  it('verifica que el mapa y el sidebar carguen con datos reales', () => {
    cy.visit('/mapa', {
      onBeforeLoad: (win) => {
        setSession(win);
      },
    });

    // Espera que la página y el mapa carguen
    cy.contains(/Mapa de Usuarios y Sucursales/i, { timeout: 30000 }).should('be.visible');
    cy.get('.ruta-map', { timeout: 30000 }).should('exist');

    // ✅ Verifica que el sidebar esté visible y tenga contenido real
    cy.get('.map-sidebar-left', { timeout: 30000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        expect(text.trim().length).to.be.greaterThan(0);
        expect(text).not.to.match(/cargando|loading/i);
    });
    
    cy.get('.map-sidebar-rigth', { timeout: 30000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        expect(text.trim().length).to.be.greaterThan(0);
        expect(text).not.to.match(/cargando|loading/i);
    });

    ['sucursales', 'cuadrillas', 'encargados'].forEach((tipo) => {
      cy.get(`button.${tipo}`, { timeout: 30000 })
        .should('be.visible')
        .should('have.class', 'active');
    });

    cy.get('.cuadrilla-marker', { timeout: 30000 })
      .should('exist')
      .and('have.length.greaterThan', 0);
    cy.get('.encargado-marker', { timeout: 30000 })
      .should('exist')
      .and('have.length.greaterThan', 0);
    cy.get('.sucursal-marker', { timeout: 30000 })
      .should('exist')
      .and('have.length.greaterThan', 0);

    cy.get('button.cuadrillas').click();
    cy.get('.cuadrilla-marker', { timeout: 10000 }).should('not.exist');
    cy.get('button.encargados').click();
    cy.get('.encargado-marker', { timeout: 10000 }).should('not.exist');
    cy.get('button.sucursales').click();
    cy.get('.sucursal-marker', { timeout: 10000 }).should('not.exist');

    cy.get('button.sucursales').click();
    cy.get('.sucursal-marker', { timeout: 10000 }).should('exist');

    cy.get('.sucursal-marker', { timeout: 10000 }).first().click({ force: true });
    cy.get('.leaflet-popup-content', { timeout: 10000 })
      .should('be.visible')
      .find('span')
      .contains('Sucursal')
      .should('exist');

    cy.get('.compass').should('be.visible').click();
  });
});
