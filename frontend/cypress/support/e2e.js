import './commands.js';

console.log('Running Cypress e2e support file');

before(() => {
  // Evita errores por scripts externos (Google Maps / GSI)
  cy.stubGoogleGlobals();
});

// Por defecto, stub de servicios externos comunes
beforeEach(() => {
  cy.intercept('GET', 'https://www.googleapis.com/oauth2/v3/tokeninfo*', {
    statusCode: 200,
    body: { email: 'test@example.com', sub: 'google-sub-123' },
  }).as('googleTokenInfo');
});
