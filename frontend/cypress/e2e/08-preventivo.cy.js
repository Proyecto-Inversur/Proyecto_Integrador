describe('Modulo de Preventivos - Integracion', () => {
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

  it('carga la pagina del preevenivo con su informacion, envia mensajes por el chat, carga y elimina planillas y fotos', () => {
    cy.visit('/mantenimientos-preventivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Mantenimientos Preventivos/i, { timeout: 30000 }).should('be.visible');
    cy.contains('tr', 'Cliente E2E', { timeout: 30000 }).click();

    cy.contains('.info-section > :nth-child(2)', 'Cliente E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('.info-section > :nth-child(3)', 'Sucursal E2E - Mensual', { timeout: 30000 }).should('be.visible');
    cy.contains('.info-section > :nth-child(4)', 'Cuadrilla E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('.info-section > :nth-child(5)', 'Zona E2E', { timeout: 30000 }).should('be.visible');
    
    cy.contains('.info-section > :nth-child(7)', 'Mantenimiento no finalizado', { timeout: 30000 }).should('be.visible');
    
    cy.get('.chat-input').clear().type('Hola');
    cy.get('.chat-send-btn > svg').click();
    cy.get('.chat-message', { timeout: 30000 }).last().find('.chat-message-text').should('have.text', 'Hola');
    cy.get('.chat-message', { timeout: 30000 }).last().find('.chat-info').should('contain', 'Test User');
    
    cy.get('.planilla-section', { timeout: 30000 }).find('button', 'Cargar').click();
    cy.get('#planillaUpload', { timeout: 30000 }).attachFile('Logo.png');
    cy.contains('button', 'Guardar Planilla', { timeout: 30000 }).should('be.visible').click();
    cy.get('.planilla-slide > .photo-container > .gallery-thumbnail', { timeout: 30000 }).click();
    cy.contains('button', 'Cerrar', { timeout: 30000 }).should('be.visible').click();
    
    cy.get('.photos-section', { timeout: 30000 }).find('button', 'Cargar').click();
    cy.get('#photoUpload', { timeout: 30000 }).attachFile('Logo.png');
    cy.contains('button', 'Guardar Fotos', { timeout: 30000 }).should('be.visible').click();
    cy.get('.gallery-item > .photo-container > .gallery-thumbnail', { timeout: 30000 }).click();
    cy.contains('button', 'Cerrar', { timeout: 30000 }).should('be.visible').click();
    
    cy.contains('button', 'Marcar como finalizado', { timeout: 30000 }).should('be.visible').click();
    cy.contains('.fade', 'Mantenimiento marcado como finalizado correctamente.', { timeout: 30000 }).should('be.visible');

    cy.get('.planilla-section > .mt-2 > .icon-button > svg', { timeout: 30000 }).click();
    cy.get('.planilla-slide > .photo-container > .gallery-thumbnail', { timeout: 30000 }).click();
    cy.get('.btn-danger', { timeout: 30000 }).click();
    cy.contains('.fade', 'Planilla(s) eliminada(s) correctamente.', { timeout: 30000 }).should('be.visible');
    
    cy.get('.photos-section > .mt-2 > .icon-button > svg', { timeout: 30000 }).click();
    cy.get('.gallery-item > .photo-container > .gallery-thumbnail', { timeout: 30000 }).click();
    cy.get('.btn-danger', { timeout: 30000 }).click();
    cy.contains('.fade', 'Fotos eliminadas correctamente.', { timeout: 30000 }).should('be.visible');
    
    cy.contains('button', 'Marcar como pendiente', { timeout: 30000 }).should('be.visible').click();
    cy.contains('.fade', 'Mantenimiento marcado como pendiente correctamente.', { timeout: 30000 }).should('be.visible');
  });
});
