describe('Módulo de Reportes - Integración con datos reales', () => {
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
  });

  it('verifica que la página de reportes cargue y genere los gráficos con datos reales', () => {
    cy.visit('/reportes', {
      onBeforeLoad: (win) => {
        setSession(win);
      },
    });

    // ✅ Espera que el encabezado principal se muestre
    cy.contains('Reportes', { timeout: 30000 }).should('be.visible');

    // ✅ Verifica que existan los filtros de mes y año
    cy.get('.filters-container', { timeout: 30000 }).within(() => {
      cy.get('select').should('have.length.at.least', 2);
      cy.get('.generate-button').should('be.visible');
      cy.get('.download-button').should('be.visible');
    });

    // ✅ Clic en "Generar Reportes"
    cy.get('.generate-button').click();

    // ✅ Espera que los gráficos se generen (canvas)
    cy.get('canvas', { timeout: 30000 })
      .should('exist')
      .and('have.length.greaterThan', 0);

    // ✅ Verifica que existan algunas tablas de datos
    cy.get('.report-table', { timeout: 30000 })
      .should('exist')
      .and('have.length.greaterThan', 0);

    // ✅ Clic en el botón de "Descargar Reporte"
    // Solo se verifica que el evento se dispare sin errores
    cy.window().then((win) => {
      const spy = cy.spy(win, 'alert').as('alertSpy');
      cy.get('.download-button').click();
      cy.wait(2000);
      cy.get('@alertSpy').should('not.have.been.called');
    });
  });
});
