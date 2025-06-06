describe('Login Flow with Mocked Google Sign-In', () => {
  beforeEach(() => {
    console.log('Running beforeEach hook');
    cy.mockGoogleSignIn({ email: 'admin@example.com', name: 'Admin User' });
    cy.window().then((win) => {
      cy.log('window.__firebase_auth__ after mock:', !!win.__firebase_auth__);
    });
  });

  it('should successfully log in with Google and redirect to home', () => {
    cy.intercept('POST', '/auth/verify', {
      statusCode: 200,
      body: {
        success: true,
        data: { user: { email: 'admin@example.com', name: 'Admin User' } },
      },
    }).as('verifyUser');

    cy.get('button.custom-login-btn').contains('Iniciar Sesión con Google').click();

    cy.wait('@verifyUser', { timeout: 50000 });

    cy.url({ timeout: 20000 }).should('eq', `${Cypress.config('baseUrl')}/`);
  });

  it('should show error message when user is not registered', () => {
    cy.intercept('POST', '/auth/verify', {
      statusCode: 403,
      body: { detail: 'Usuario no registrado' },
    }).as('verifyUserError');

    cy.get('button.custom-login-btn').contains('Iniciar Sesión con Google').click();

    cy.wait('@verifyUserError', { timeout: 50000 });

    cy.get('.alert-danger', { timeout: 20000 })
      .should('be.visible')
      .and('contain.text', 'Usuario no registrado. Por favor, crea una cuenta.');
  });
});