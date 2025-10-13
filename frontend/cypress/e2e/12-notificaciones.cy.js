describe('Modulo de Cuadrillas - Integracion', () => {
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

  /*it('Carga notificaciones, redirige a la pagina correspondiente, marca como leida y elimina notificaciones', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.get('.notification-icon > svg > path').click();
    cy.contains('div > .flex-grow-1 > .text-dark', 'Correctivo Asignado')
    .find('span')
    .contains('.rounded-circle')
    .first()
    .click();

    cy.get('.notification-icon > svg > path').click();

    cy.contains('div > .flex-grow-1 > .text-dark', 'Correctivo Asignado')
    .find('span')
    .contains('.rounded-circle')
    .first()
    .should('not.exist');

    cy.contains('div > .flex-grow-1 > .text-dark', 'Preventivo Asignado')
    .find('span')
    .contains('.rounded-circle')
    .first()
    .click();

    cy.get('.notification-icon > svg > path').click();

    cy.contains('div > .flex-grow-1 > .text-dark', 'Preventivo Asignado')
    .find('span')
    .contains('.rounded-circle')
    .first()
    .should('not.exist');

    cy.contains('button', 'Marcar Leídas').click();
    
    cy.contains('div > .flex-grow-1 > .text-dark', { timeout: 30000 })
    .find('span')
    .contains('.rounded-circle')
    .first()
    .should('not.exist');

    cy.contains('button', 'Eliminar Leídas').click();

    cy.contains('p.text-muted', 'No tienes notificaciones.', { timeout: 30000 }).click();
  });*/

  it('Navega por la aplicacion y borra datos de tests', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });
    /* ==== Generated with Cypress Studio ==== */
    cy.contains('.home-button', 'Usuarios').should('be.visible').click();
    cy.contains('tr', 'Usuario E2E').within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.get('.floating-back-btn-home').click();

    cy.contains('.home-button', 'Mantenimiento').should('be.visible').click();

    cy.contains('.home-button', 'Mantenimiento Preventivo').should('be.visible').click();
    cy.contains('tr', 'Sucursal E2E - Mensual').within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.contains('button', 'Agregar', { timeout: 30000 }).should('be.visible').click();
    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item', 'Sucursal E2E - Mensual').within(() => {
      cy.get('.custom-delete-button').click();
    });
    cy.get('.btn-close').click();
    cy.get('.floating-back-btn-home').click();

    cy.contains('.home-button', 'Mantenimiento Correctivo').should('be.visible').click();
    cy.contains('tr', 'Sucursal E2E').within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.get('.floating-back-btn-home').click();

    cy.contains('.home-button', 'Sucursales').should('be.visible').click();
    cy.contains('tr', 'Sucursal E2E').within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });
    cy.get('.floating-back-btn-home').click();

    cy.contains('.home-button', 'Cuadrillas').should('be.visible').click();
    cy.contains('tr', 'Cuadrilla E2E').within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });
    cy.contains('button', 'Agregar').should('be.visible').click();
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', 'Zona E2E')
      .should('exist')
      .within(() => {
        cy.get('.custom-delete-button').click();
      });
    cy.get('.btn-close').click();
    cy.get('.floating-back-btn-home').click();
  });
});
