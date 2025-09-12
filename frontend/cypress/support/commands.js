// Utilidad para simular sesión autenticada sin pasar por Google/Firebase
Cypress.Commands.add('setAuthSession', (entity = {
  type: 'usuario',
  data: { id: 1, uid: 'test-uid', nombre: 'Test User', email: 'test@example.com', rol: 'Administrador' },
}) => {
  const idToken = 'e2e-token';
  window.sessionStorage.setItem('authToken', idToken);
  window.localStorage.setItem('authToken', idToken);
  window.sessionStorage.setItem('currentEntity', JSON.stringify(entity));
  window.localStorage.setItem('currentEntity', JSON.stringify(entity));
});

// Stub básico de Google APIs para prevenir errores de carga
Cypress.Commands.add('stubGoogleGlobals', () => {
  cy.on('window:before:load', (win) => {
    win.google = win.google || {
      accounts: { id: { initialize: () => {}, prompt: () => {} } },
      maps: { places: {} },
    };
  });
});
