describe('Modulo de Sucursales - Integracion', () => {
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

  const setupPlacesStubs = (win) => {
    const suggestion = { description: 'Universidad Católica de Córdoba - Campus Universitario, Avenida Armada Argentina, Córdoba, Argentina', place_id: 'fake-place-id' };
    const geocodeResult = [
      {
        geometry: {
          location: {
            lat: () => -31.4861222,
            lng: () => -64.2458649,
          },
        },
      },
    ];

    win.google = win.google || {};
    win.google.maps = win.google.maps || {};
    win.google.maps.places = win.google.maps.places || {};

    class AutocompleteService {
      getPlacePredictions(_options, callback) {
        callback([suggestion], 'OK');
      }
    }

    class Geocoder {
      geocode(_options, callback) {
        callback(geocodeResult, 'OK');
      }
    }

    class PlacesService {
      getDetails(_options, callback) {
        callback({}, 'OK');
      }
    }

    win.google.maps.places.AutocompleteService = AutocompleteService;
    win.google.maps.places.AutocompleteSessionToken =
    win.google.maps.places.AutocompleteSessionToken || function () {};
    win.google.maps.places.PlacesService = PlacesService;
    win.google.maps.Geocoder = Geocoder;
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then(() => {
      // no-op, solo asegura la disponibilidad de window antes de visitar
    });
  });

  it('carga la pagina y crea, edita y elimina una sucursal', () => {
    const baseSucursalName = 'Sucursal E2E';
    const updatedSucursalName = `${baseSucursalName} Editada`;
    const suggestionDescription = 'Universidad Católica de Córdoba - Campus Universitario, Avenida Armada Argentina, Córdoba, Argentina';
    const initialColumns = ['id', 'nombre', 'zona', 'direccion', 'superficie', 'acciones'];
    let sucursalesData = [];
    let zonasData = [
      { id: 1, nombre: 'Zona Centro' },
      { id: 2, nombre: 'Zona Norte' },
    ];
    let nextSucursalId = 700;

    cy.intercept('GET', '**/preferences/sucursales', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getSucursalColumnPreferences');

    cy.intercept('PUT', '**/preferences/sucursales', (req) => {
      req.alias = 'saveSucursalColumnPreferences';
      req.reply({ statusCode: 200, body: { columns: req.body.columns } });
    });

    cy.intercept('GET', '**/sucursales/', (req) => {
      req.reply({ statusCode: 200, body: sucursalesData });
    }).as('getSucursales');

    cy.intercept('GET', '**/zonas/', (req) => {
      req.reply({ statusCode: 200, body: zonasData });
    }).as('getZonas');

    cy.intercept('POST', '**/sucursales/', (req) => {
      nextSucursalId += 1;
      const nuevaSucursal = {
        id: nextSucursalId,
        nombre: req.body.nombre,
        zona: req.body.zona,
        direccion: req.body.direccion?.address || '',
        superficie: req.body.superficie,
      };
      sucursalesData = [...sucursalesData, nuevaSucursal];
      req.reply({ statusCode: 201, body: nuevaSucursal });
    }).as('createSucursal');

    cy.intercept('PUT', '**/sucursales/*', (req) => {
      const id = Number(req.url.split('/').pop());
      const index = sucursalesData.findIndex((sucursal) => sucursal.id === id);
      if (index !== -1) {
        const direccionActualizada =
          req.body.direccion?.address || sucursalesData[index].direccion;
        sucursalesData[index] = {
          ...sucursalesData[index],
          nombre: req.body.nombre,
          zona: req.body.zona,
          direccion: direccionActualizada,
          superficie: req.body.superficie,
        };
      }
      req.reply({ statusCode: 200, body: sucursalesData[index] });
    }).as('updateSucursal');

    cy.intercept('DELETE', '**/sucursales/*', (req) => {
      const id = Number(req.url.split('/').pop());
      sucursalesData = sucursalesData.filter((sucursal) => sucursal.id !== id);
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('deleteSucursal');

    cy.stubGoogleGlobals();

    cy.visit('/sucursales', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
        setupPlacesStubs(win);
      },
    });

    cy.wait('@getSucursales');
    cy.wait('@getSucursalColumnPreferences');
    cy.contains(/Sucursales/i, { timeout: 20000 }).should('be.visible');

    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getZonas');
    cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');

    cy.get('input[name="nombre"]').clear().type(baseSucursalName);
    cy.get('#dropdown-zona').click();
    cy.contains('.dropdown-item', 'Zona Centro').click();

    cy.get('.direccion-autocomplete-input').should('not.be.disabled').type('Universidad Católica de Córdoba');
    cy.contains('.direccion-autocomplete-item', suggestionDescription, { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.get('input[name="superficie"]').clear().type('100');

    cy.contains('button', 'Guardar').click();

    cy.wait('@createSucursal');
    cy.wait('@getSucursales');

    cy.contains('td', baseSucursalName, { timeout: 20000 }).should('be.visible');
    cy.contains('td', 'Zona Centro').should('be.visible');
    cy.contains('tr', baseSucursalName).within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getZonas');
    cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');

    cy.get('input[name="nombre"]').clear().type(updatedSucursalName);
    cy.get('.direccion-autocomplete-input').should('not.be.disabled').type('Universidad Católica de Córdoba');
    cy.contains('.direccion-autocomplete-item', suggestionDescription, { timeout: 10000 })
      .should('be.visible')
      .click();
    
    cy.contains('button', 'Guardar').click();

    cy.wait('@updateSucursal');
    cy.wait('@getSucursales');

    cy.contains('td', updatedSucursalName, { timeout: 20000 }).should('be.visible');

    cy.contains('tr', updatedSucursalName).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });

    cy.wait('@deleteSucursal');
    cy.wait('@getSucursales');

    cy.contains('td', updatedSucursalName).should('not.exist');
  });

  it('permite ocultar columnas mediante el selector', () => {
    const sampleSucursales = [
      {
        id: 301,
        nombre: 'Sucursal Demo',
        zona: 'Zona Centro',
        direccion: 'Av. Demo 123',
        superficie: '100',
      },
    ];
    const initialColumns = ['id', 'nombre', 'zona', 'direccion', 'superficie', 'acciones'];

    cy.intercept('GET', '**/preferences/sucursales', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getSucursalColumnPreferences');

    cy.intercept('PUT', '**/preferences/sucursales', (req) => {
      req.alias = 'saveSucursalColumnPreferences';
      req.reply({ statusCode: 200, body: { columns: req.body.columns } });
    });

    cy.intercept('GET', '**/sucursales/', {
      statusCode: 200,
      body: sampleSucursales,
    }).as('getSucursales');

    cy.stubGoogleGlobals();

    cy.visit('/sucursales', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
        setupPlacesStubs(win);
      },
    });

    cy.wait('@getSucursales');
    cy.wait('@getSucursalColumnPreferences');

    cy.get('table thead th').should('contain', 'Dirección');

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-direccion').should('be.checked').uncheck({ force: true });
    cy.contains('button', 'Guardar').click();

    cy.wait('@saveSucursalColumnPreferences')
      .its('request.body.columns')
      .should('deep.equal', ['id', 'nombre', 'zona', 'superficie', 'acciones']);

    cy.get('table thead th').should(($ths) => {
      const texts = Array.from($ths, (th) => th.innerText.trim());
      expect(texts).to.not.include('Dirección');
    });

    cy.get('table tbody tr').first().find('td').should('have.length', 5);
  });

  it('permite crear y eliminar una zona desde el formulario', () => {
    const initialColumns = ['id', 'nombre', 'zona', 'direccion', 'superficie', 'acciones'];
    let sucursalesData = [];
    let zonasData = [
      { id: 1, nombre: 'Zona Centro' },
      { id: 2, nombre: 'Zona Norte' },
    ];
    let zonaCounter = 50;

    cy.intercept('GET', '**/preferences/sucursales', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getSucursalColumnPreferences');

    cy.intercept('GET', '**/sucursales/', (req) => {
      req.reply({ statusCode: 200, body: sucursalesData });
    }).as('getSucursales');

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

    cy.stubGoogleGlobals();

    cy.visit('/sucursales', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
        setupPlacesStubs(win);
      },
    });

    cy.wait('@getSucursales');
    cy.wait('@getSucursalColumnPreferences');

    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getZonas');
    cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');

    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', 'Zona Centro').should('exist');

    cy.contains('.custom-dropdown-item-add', 'Agregar nueva zona...').click();

    const newZoneName = 'Zona Oeste';
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
});
