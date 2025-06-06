console.log('Registering mockGoogleSignIn command');

Cypress.Commands.add('mockGoogleSignIn', ({ email = 'test@example.com', name = 'Test User', uid = 'mock-uid-123', idToken = 'mock-id-token' } = {}) => {
    cy.window().then((win) => {
        cy.log('Mocking signInWithPopup with email:', email);
        if (!win.__firebase_auth__) {
        win.__firebase_auth__ = {
            signInWithPopup: () => {
            cy.log('Manual mock signInWithPopup called for email:', email);
            return Promise.resolve({
                user: {
                email,
                displayName: name,
                uid,
                getIdToken: () => Promise.resolve(idToken),
                },
            });
            },
        };
        cy.log('Mock set in mockGoogleSignIn command');
        } else {
        cy.log('Mock already set on window.__firebase_auth__');
        }
    });
});