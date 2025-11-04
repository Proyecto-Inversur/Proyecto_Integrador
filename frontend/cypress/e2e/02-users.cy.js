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
    cy.window().then(() => {});
  });

  it('carga la pagina y crea, edita y elimina un usuario', () => {
    const baseUserName = 'Usuario E2E';
    const updatedUserName = `${baseUserName} Editado`;

    cy.visit('/users', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Usuarios/i, { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#nombre').clear().type(baseUserName);
    cy.get('#rol').select('Encargado de Mantenimiento');

    cy.contains('button', 'Registrar con Google').should('be.enabled').click();

    cy.contains('td', baseUserName, { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'test@example.com').should('be.visible');
    cy.contains('td', 'Encargado de Mantenimiento').should('be.visible');

    cy.contains('tr', baseUserName).within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show').should('be.visible');
    cy.get('#nombre').clear().type(updatedUserName);
    cy.contains('button', 'Guardar').click();

    cy.contains('td', updatedUserName, { timeout: 30000 }).should('be.visible');

    cy.contains('tr', updatedUserName).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });

    cy.contains('td', updatedUserName).should('not.exist');

    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#nombre').clear().type(baseUserName);
    cy.get('#rol').select('Encargado de Mantenimiento');

    cy.contains('button', 'Registrar con Google').should('be.enabled').click();
  });

  it('permite ocultar columnas mediante el selector', () => {
    cy.visit('/users', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

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
