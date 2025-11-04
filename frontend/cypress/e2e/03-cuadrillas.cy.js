describe('Modulo de Cuadrillas - Integracion', () => {
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

  it('carga la pagina y crea, edita y elimina una cuadrilla y zona', () => {
    const baseCuadrillaName = 'Cuadrilla E2E';
    const updatedCuadrillaName = `${baseCuadrillaName} Editada`;
    const cuadrillaZone = 'Zona E2E';

    cy.visit('/cuadrillas', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Cuadrillas/i, { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#nombre').clear().type(baseCuadrillaName);
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item-add', 'Agregar nueva zona...').click();
    cy.get('#zona').type(cuadrillaZone);
    cy.get('.custom-add-button').should('be.enabled').click();

    cy.contains('button', 'Registrar con Google').should('be.enabled').click();

    cy.contains('td', baseCuadrillaName, { timeout: 30000 }).should('be.visible');
    cy.contains('td', cuadrillaZone).should('be.visible');

    cy.contains('tr', baseCuadrillaName).within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#nombre').clear().type(updatedCuadrillaName);
    cy.contains('button', 'Guardar').click();

    cy.contains('td', updatedCuadrillaName, { timeout: 30000 }).should('be.visible');

    cy.contains('tr', updatedCuadrillaName).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });

    cy.contains('td', updatedCuadrillaName).should('not.exist');

    cy.contains('button', 'Agregar').should('be.visible').click();
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', cuadrillaZone)
      .should('exist')
      .within(() => {
        cy.get('.custom-delete-button').click();
      });
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', cuadrillaZone).should('not.exist');
    cy.get('#nombre').clear().type(baseCuadrillaName);
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item-add', 'Agregar nueva zona...').click();
    cy.get('#zona').type(cuadrillaZone);
    cy.get('.custom-add-button').should('be.enabled').click();

    cy.contains('button', 'Registrar con Google').should('be.enabled').click();

    cy.contains('tr', baseCuadrillaName).within(() => {
      cy.get('td').first().invoke('text').then((idText) => {
        const cuadrillaId = idText.trim();
        cy.writeFile('cypress/fixtures/cuadrillaId.json', { id: cuadrillaId });
      });
    });
  });

  it('permite ocultar columnas mediante el selector', () => {
    cy.visit('/cuadrillas', {
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
