import './commands.js';

console.log('Running e2e.js support file');

beforeEach(() => {
  cy.visit('/login');
  cy.window().then((win) => {
    cy.log('Setting up manual mock for signInWithPopup');
    win.__firebase_auth__ = {
      signInWithPopup: () => {
        cy.log('Manual mock signInWithPopup called');
        return Promise.resolve({
          user: {
            email: 'admin@example.com',
            displayName: 'Admin User',
            uid: 'mock-uid-123',
            getIdToken: () => Promise.resolve('mock-id-token'),
          },
        });
      },
    };
    cy.log('Mock set on window.__firebase_auth__:', !!win.__firebase_auth__);
  });
});