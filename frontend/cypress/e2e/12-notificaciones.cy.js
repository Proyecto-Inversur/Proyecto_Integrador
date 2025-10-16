describe('Modulo de Notificaciones - Integracion', () => {
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

  it('Carga notificaciones, redirige a la pagina correspondiente, marca como leida y elimina notificaciones', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.get('.notification-icon > svg > path').click();
    cy.contains('div > .flex-grow-1 > .text-dark', 'Nuevo correctivo asignado', { timeout: 30000 }).first().click();

    cy.get('.notification-icon > svg > path').click();
    cy.contains('div > .flex-grow-1 > .text-dark', 'Nuevo preventivo asignado', { timeout: 30000 }).first().click();

    cy.get('.notification-icon > svg > path').click();
    cy.contains('button', 'Marcar leídas').click();
    cy.wait(10000);
    cy.get('.rounded-circle').should('not.exist');
    cy.contains('button', 'Eliminar leídas').click();
    cy.contains('p.text-muted', 'No tienes notificaciones.', { timeout: 30000 }).should('be.visible');
  });

  it('Navega por la aplicacion y borra datos de usuario test', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });
    
    cy.contains('.home-button', 'Usuarios').should('be.visible').click();
    cy.contains('tr', 'Usuario E2E', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.wait(5000);
  });

  it('Navega por la aplicacion y borra datos de mantenimiento preventivo test', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains('.home-button', 'Mantenimiento').should('be.visible').click();

    cy.contains('.home-button', 'Mantenimiento Preventivo').should('be.visible').click();
    cy.contains('tr', 'Sucursal E2E - Mensual', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.wait(5000);
  });

  it('Navega por la aplicacion y borra datos de preventivo test', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains('.home-button', 'Mantenimiento').should('be.visible').click();

    cy.contains('.home-button', 'Mantenimiento Preventivo').should('be.visible').click();

    cy.contains('button', 'Agregar', { timeout: 30000 }).should('be.visible').click();
    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item', 'Sucursal E2E - Mensual', { timeout: 30000 }).within(() => {
      cy.get('.custom-delete-button').click();
    });
    cy.wait(5000);
  });

  it('Navega por la aplicacion y borra datos de mantenimiento correctivo test', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains('.home-button', 'Mantenimiento').should('be.visible').click();

    cy.contains('.home-button', 'Mantenimiento Correctivo').should('be.visible').click();
    cy.contains('tr', 'Sucursal E2E', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.wait(5000);
  });

  it('Navega por la aplicacion y borra datos de sucursal test', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains('.home-button', 'Mantenimiento').should('be.visible').click();

    cy.contains('.home-button', 'Sucursales').should('be.visible').click();
    cy.contains('tr', 'Sucursal E2E', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.wait(5000);
  });

  it('Navega por la aplicacion y borra datos de cuadrilla test', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains('.home-button', 'Mantenimiento').should('be.visible').click();

    cy.contains('.home-button', 'Cuadrillas').should('be.visible').click();
    cy.contains('tr', 'Cuadrilla E2E', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.wait(5000);
  });

  it('Navega por la aplicacion y borra datos de zona test', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains('.home-button', 'Mantenimiento').should('be.visible').click();

    cy.contains('.home-button', 'Cuadrillas').should('be.visible').click();

    cy.contains('button', 'Agregar', { timeout: 30000 }).should('be.visible').click();
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', 'Zona E2E', { timeout: 30000 })
      .should('exist')
      .within(() => {
        cy.get('.custom-delete-button').click();
      });
    cy.wait(5000);
  });
});
