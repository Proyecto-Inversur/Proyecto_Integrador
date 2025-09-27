describe('Flujo de Login', () => {
  it('redirecciona al home si ya está autenticado', () => {
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.sessionStorage.clear();
      },
    });

    cy.window().then(() => {
      cy.setAuthSession();
    });

    cy.visit('/login');
    cy.url({ timeout: 20000 }).should('eq', `${Cypress.config('baseUrl')}/`);
  });

  it('muestra error cuando el usuario no está registrado', () => {
    cy.visit('/login', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.sessionStorage.clear();
      },
    });

    cy.intercept('POST', '**/auth/verify', {
      statusCode: 403,
      body: { detail: 'Usuario no registrado' },
    }).as('verifyUserError');

    cy.contains('button', 'Iniciar Sesión con Google').click();

    cy.wait('@verifyUserError', { timeout: 30000 });
    cy.get('.alert-danger', { timeout: 30000 })
      .should('be.visible')
      .and('contain.text', 'Usuario no registrado');
  });
});
