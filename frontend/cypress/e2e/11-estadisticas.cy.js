describe('Módulo de Estadísticas - Integración con datos reales', () => {
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

  it('verifica que la página de estadísticas cargue y genere los gráficos con datos reales', () => {
    cy.visit('/estadisticas', {
      onBeforeLoad: (win) => {
        setSession(win);
      },
    });

    cy.contains('Reportes', { timeout: 30000 }).should('be.visible');

    cy.get('#preventivos-cliente', { timeout: 30000 }).select('Cliente E2E');
    cy.get('#preventivos-zona', { timeout: 30000 }).select('Zona E2E');
    cy.get('#preventivos-sucursal', { timeout: 30000 }).select('Sucursal E2E');
    cy.get('#preventivos-cuadrilla', { timeout: 30000 }).select('Cuadrilla E2E');

    cy.get(':nth-child(3) > .graph-grid > .chart-card > canvas', { timeout: 30000 })
      .should('exist')
      .and('have.length', 1);
    
    cy.get(':nth-child(3) > .report-table', { timeout: 30000 })
      .should('exist')
      .and('have.length', 1);
    
    cy.get('#correctivos-cliente', { timeout: 30000 }).select('Cliente E2E');
    cy.get('#correctivos-zona', { timeout: 30000 }).select('Zona E2E');
    cy.get('#correctivos-sucursal', { timeout: 30000 }).select('Sucursal E2E');
    cy.get('#correctivos-cuadrilla', { timeout: 30000 }).select('Cuadrilla E2E');

    cy.get(':nth-child(4) > .graph-grid > .chart-card > canvas', { timeout: 30000 })
      .should('exist')
      .and('have.length', 1);
    
    cy.get(':nth-child(4) > .report-table', { timeout: 30000 })
      .should('exist')
      .and('have.length', 1);

    cy.get('#zonas-cliente', { timeout: 30000 }).select('Cliente E2E');
    cy.get('#zonas-cuadrilla', { timeout: 30000 }).select('Cuadrilla E2E');

    cy.get(':nth-child(6) > .chart-card > canvas', { timeout: 30000 })
      .should('exist')
      .and('have.length', 1);
    
    cy.get(':nth-child(6) > .report-table', { timeout: 30000 })
      .should('exist')
      .and('have.length', 1);

    cy.get('#sucursales-cliente', { timeout: 30000 }).select('Cliente E2E');
    cy.get('#sucursales-zona', { timeout: 30000 }).select('Zona E2E');
    cy.get('#sucursales-cuadrilla', { timeout: 30000 }).select('Cuadrilla E2E');

    cy.get(':nth-child(7) > .chart-card > canvas', { timeout: 30000 })
      .should('exist')
      .and('have.length', 1);
    
    cy.get(':nth-child(7) > .report-table', { timeout: 30000 })
      .should('exist')
      .and('have.length', 1);

    cy.window().then((win) => {
      const spy = cy.spy(win, 'alert').as('alertSpy');
      cy.get('.download-button').click();
      cy.wait(2000);
      cy.get('@alertSpy').should('not.have.been.called');
    });
  });
});
