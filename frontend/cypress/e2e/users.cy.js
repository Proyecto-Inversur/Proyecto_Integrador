describe('Módulo de Usuarios - Integración', () => {
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

  before(() => {
    // Reset DB before running the suite
    cy.task('db:reset');
  });

  beforeEach(() => {
    // Ensure clean storage before each test
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then(() => {
      // no-op, just to ensure window exists before visit
    });
  });

  it('carga la página y crea, edita y elimina un usuario', () => {
    // Open Users page with a pre-set admin session
    cy.visit('/users', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    // Should see page title and Agregar button (be tolerant of accents)
    cy.contains(/Usuarios/i, { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Agregar').should('be.visible').click();

    // Modal opens, fill in the form
    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="nombre"]').clear().type('Usuario E2E');
    cy.get('select[name="rol"]').select('Encargado de Mantenimiento');

    // Submit create (uses fake Google flow on frontend; backend runs in TESTING mode)
    cy.contains('button', 'Registrar con Google').click();

    // After closing, table should show the new row
    cy.contains('td', 'Usuario E2E', { timeout: 20000 }).should('be.visible');
    cy.contains('td', 'test@example.com').should('be.visible');
    cy.contains('td', 'Encargado de Mantenimiento').should('be.visible');

    // Edit the created user
    cy.get('button[aria-label="Editar"]').first().click();
    cy.get('div.modal.show').should('be.visible');
    cy.get('input[name="nombre"]').clear().type('Usuario E2E Editado');
    cy.contains('button', 'Guardar').click();

    // Assert update
    cy.contains('td', 'Usuario E2E Editado', { timeout: 20000 }).should('be.visible');

    // Delete the user
    cy.get('button[aria-label="Eliminar"]').first().click();

    // Assert deletion
    cy.contains('td', 'Usuario E2E Editado').should('not.exist');
  });
});
