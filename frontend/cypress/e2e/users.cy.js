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
    const baseUserName = 'Usuario E2E';
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

  it('permite ocultar columnas mediante el selector', () => {
    const sampleUsers = [
      {
        id: 101,
        nombre: 'Usuario de Prueba',
        email: 'ocultar@example.com',
        rol: 'Encargado de Mantenimiento',
      },
    ];
    const initialColumns = ['id', 'nombre', 'email', 'rol', 'acciones'];

    cy.intercept('GET', '**/preferences/users', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getUserColumnPreferences');

    cy.intercept('PUT', '**/preferences/users', (req) => {
      req.alias = 'saveUserColumnPreferences';
      req.reply({ statusCode: 200, body: { columns: req.body.columns } });
    });

    cy.intercept('GET', '**/users/', {
      statusCode: 200,
      body: sampleUsers,
    }).as('getUsers');

    cy.visit('/users', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.wait('@getUsers');
    cy.wait('@getUserColumnPreferences');

    cy.get('table thead th').should('contain', 'Email');

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-email').should('be.checked').uncheck({ force: true });
    cy.contains('button', 'Guardar').click();

    cy.wait('@saveUserColumnPreferences')
      .its('request.body.columns')
      .should('deep.equal', ['id', 'nombre', 'rol', 'acciones']);

    cy.get('table thead th').should(($ths) => {
      const texts = Array.from($ths, (th) => th.innerText.trim());
      expect(texts).to.not.include('Email');
    });

    cy.get('table tbody tr').first().find('td').should('have.length', 4);
  });
});

