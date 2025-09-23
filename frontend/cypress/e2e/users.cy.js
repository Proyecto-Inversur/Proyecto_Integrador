describe('Modulo de Usuarios - Integracion', () => {
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
    cy.window().then(() => {
      // no-op, just to ensure window exists before visit
    });
  });

  it('carga la pagina y crea, edita y elimina un usuario', () => {
    const baseUserName = `Usuario E2E ${Date.now()}`;
    const updatedUserName = `${baseUserName} Editado`;

    cy.visit('/users', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Usuarios/i, { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="nombre"]').clear().type(baseUserName);
    cy.get('select[name="rol"]').select('Encargado de Mantenimiento');

    cy.contains('button', 'Registrar con Google').click();

    cy.contains('td', baseUserName, { timeout: 20000 }).should('be.visible');
    cy.contains('td', 'test@example.com').should('be.visible');
    cy.contains('td', 'Encargado de Mantenimiento').should('be.visible');

    cy.contains('tr', baseUserName).within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show').should('be.visible');
    cy.get('input[name="nombre"]').clear().type(updatedUserName);
    cy.contains('button', 'Guardar').click();

    cy.contains('td', updatedUserName, { timeout: 20000 }).should('be.visible');

    cy.contains('tr', updatedUserName).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });

    cy.contains('td', updatedUserName).should('not.exist');
  });
});
