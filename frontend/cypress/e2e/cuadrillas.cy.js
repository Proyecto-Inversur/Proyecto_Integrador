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
    cy.window().then(() => {
      // no-op, solo asegura la disponibilidad de window antes de visitar
    });
  });

  it('carga la pagina y crea, edita y elimina una cuadrilla', () => {
    const baseCuadrillaName = 'Cuadrilla E2E';
    const updatedCuadrillaName = `${baseCuadrillaName} Editada`;
    const cuadrillaZone = 'Zona Centro';
    const initialColumns = ['id', 'nombre', 'zona', 'email', 'acciones'];
    let cuadrillasData = [];
    let idCounter = 1000;

    cy.intercept('GET', '**/preferences/cuadrillas', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getCuadrillaColumnPreferences');

    cy.intercept('PUT', '**/preferences/cuadrillas', (req) => {
      req.alias = 'saveCuadrillaColumnPreferences';
      req.reply({ statusCode: 200, body: { columns: req.body.columns } });
    });

    cy.intercept('GET', '**/cuadrillas/', (req) => {
      req.reply({ statusCode: 200, body: cuadrillasData });
    }).as('getCuadrillas');

    cy.intercept('GET', '**/zonas/', {
      statusCode: 200,
      body: [
        { id: 1, nombre: cuadrillaZone },
        { id: 2, nombre: 'Zona Norte' },
      ],
    }).as('getZonas');

    cy.intercept('POST', '**/auth/create-cuadrilla', (req) => {
      idCounter += 1;
      const nuevaCuadrilla = {
        id: idCounter,
        nombre: req.body.nombre,
        zona: req.body.zona,
        email: req.body.email || 'test@example.com',
      };
      cuadrillasData.push(nuevaCuadrilla);
      req.reply({ statusCode: 201, body: nuevaCuadrilla });
    }).as('createCuadrilla');

    cy.intercept('PUT', '**/auth/update-cuadrilla/*', (req) => {
      const id = Number(req.url.split('/').pop());
      const index = cuadrillasData.findIndex((cuadrilla) => cuadrilla.id === id);
      if (index !== -1) {
        cuadrillasData[index] = {
          ...cuadrillasData[index],
          ...req.body,
        };
      }
      req.reply({ statusCode: 200, body: cuadrillasData[index] });
    }).as('updateCuadrilla');

    cy.intercept('DELETE', '**/auth/delete-cuadrilla/*', (req) => {
      const id = Number(req.url.split('/').pop());
      cuadrillasData = cuadrillasData.filter((cuadrilla) => cuadrilla.id !== id);
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('deleteCuadrilla');

    cy.visit('/cuadrillas', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.wait('@getCuadrillas');
    cy.wait('@getCuadrillaColumnPreferences');
    cy.contains(/Cuadrillas/i, { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getZonas');

    cy.get('input[name="nombre"]').clear().type(baseCuadrillaName);
    cy.get('#dropdown-zona').click();
    cy.contains('.dropdown-item', cuadrillaZone).click();

    cy.contains('button', 'Registrar con Google').click();

    cy.wait('@createCuadrilla');
    cy.wait('@getCuadrillas');

    cy.contains('td', baseCuadrillaName, { timeout: 20000 }).should('be.visible');
    cy.contains('td', cuadrillaZone).should('be.visible');

    cy.contains('tr', baseCuadrillaName).within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getZonas');

    cy.get('input[name="nombre"]').clear().type(updatedCuadrillaName);
    cy.contains('button', 'Guardar').click();

    cy.wait('@updateCuadrilla');
    cy.wait('@getCuadrillas');

    cy.contains('td', updatedCuadrillaName, { timeout: 20000 }).should('be.visible');

    cy.contains('tr', updatedCuadrillaName).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });

    cy.wait('@deleteCuadrilla');
    cy.wait('@getCuadrillas');

    cy.contains('td', updatedCuadrillaName).should('not.exist');
  });

  it('permite crear y eliminar zonas desde el formulario', () => {
    const initialColumns = ['id', 'nombre', 'zona', 'email', 'acciones'];
    let cuadrillasData = [];
    let zonasData = [
      { id: 1, nombre: 'Zona Centro' },
      { id: 2, nombre: 'Zona Norte' },
    ];
    let zonaCounter = 100;

    cy.intercept('GET', '**/preferences/cuadrillas', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getCuadrillaColumnPreferences');

    cy.intercept('GET', '**/cuadrillas/', (req) => {
      req.reply({ statusCode: 200, body: cuadrillasData });
    }).as('getCuadrillas');

    cy.intercept('GET', '**/zonas/', (req) => {
      req.reply({ statusCode: 200, body: zonasData });
    }).as('getZonas');

    cy.intercept('POST', '**/zonas/', (req) => {
      zonaCounter += 1;
      const nuevaZona = { id: zonaCounter, nombre: req.body.nombre };
      zonasData = [...zonasData, nuevaZona];
      req.reply({ statusCode: 201, body: nuevaZona });
    }).as('createZona');

    cy.intercept('DELETE', '**/zonas/*', (req) => {
      const id = Number(req.url.split('/').pop());
      zonasData = zonasData.filter((zona) => zona.id !== id);
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('deleteZona');

    cy.visit('/cuadrillas', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.wait('@getCuadrillas');
    cy.wait('@getCuadrillaColumnPreferences');

    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getZonas');
    cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');

    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', 'Zona Centro').should('exist');

    cy.contains('.custom-dropdown-item-add', 'Agregar nueva zona...').click();

    const newZoneName = 'Zona Sur';
    cy.get('input[placeholder="Escriba la nueva zona"]').type(newZoneName);
    cy.get('.custom-add-button').should('be.enabled').click();

    cy.wait('@createZona');
    cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
    cy.get('#dropdown-zona').should('contain', newZoneName);

    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', newZoneName)
      .should('exist')
      .within(() => {
        cy.get('.custom-delete-button').click();
      });

    cy.wait('@deleteZona');
    cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', newZoneName).should('not.exist');
    cy.get('#dropdown-zona').click();
    cy.get('#dropdown-zona').should('contain', 'Seleccione una zona');
  });

  it('permite ocultar columnas mediante el selector', () => {
    const sampleCuadrillas = [
      {
        id: 201,
        nombre: 'Cuadrilla Demo',
        zona: 'Zona Centro',
        email: 'demo@example.com',
      },
    ];
    const initialColumns = ['id', 'nombre', 'zona', 'email', 'acciones'];

    cy.intercept('GET', '**/preferences/cuadrillas', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getCuadrillaColumnPreferences');

    cy.intercept('PUT', '**/preferences/cuadrillas', (req) => {
      req.alias = 'saveCuadrillaColumnPreferences';
      req.reply({ statusCode: 200, body: { columns: req.body.columns } });
    });

    cy.intercept('GET', '**/cuadrillas/', {
      statusCode: 200,
      body: sampleCuadrillas,
    }).as('getCuadrillas');

    cy.visit('/cuadrillas', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.wait('@getCuadrillas');
    cy.wait('@getCuadrillaColumnPreferences');

    cy.get('table thead th').should('contain', 'Email');

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-email').should('be.checked').uncheck({ force: true });
    cy.contains('button', 'Guardar').click();

    cy.wait('@saveCuadrillaColumnPreferences')
      .its('request.body.columns')
      .should('deep.equal', ['id', 'nombre', 'zona', 'acciones']);

    cy.get('table thead th').should(($ths) => {
      const texts = Array.from($ths, (th) => th.innerText.trim());
      expect(texts).to.not.include('Email');
    });

    cy.get('table tbody tr').first().find('td').should('have.length', 4);
  });
});
