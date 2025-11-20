describe('Modulo de Clientes - Integracion', () => {
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
    cy.window().then(() => {});
  });

  it('carga la pagina y crea, edita y elimina un cliente y una sucursal', () => {
    const baseClienteName = 'Cliente E2E';
    const baseSucursalName = 'Sucursal E2E';
    const updatedClienteName = `${baseClienteName} Editada`;
    const updatedSucursalName = `${baseSucursalName} Editada`;
    const suggestionDescription = 'Universidad Católica de Córdoba - Campus Universitario, Avenida Armada Argentina, Córdoba, Argentina';
    const sucursalZone = 'Zona E2E';

    cy.stubGoogleGlobals();

    cy.visit('/clientes', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
        setupPlacesStubs(win);
      },
    });

    cy.contains(/Sucursales/i, { timeout: 30000 }).should('be.visible');

    cy.contains('button', 'Nuevo Cliente').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#clienteNombre').clear().type(baseClienteName);
    cy.get('#clienteContacto').clear().type('1234567891');
    cy.get('#clienteEmail').clear().type('contacto@mail.com');
    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('td', baseClienteName, { timeout: 30000 }).should('be.visible');
    cy.contains('td', '1234567891', { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'contacto@mail.com', { timeout: 30000 }).should('be.visible');
    cy.contains('tr', baseClienteName, { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Editar cliente"]').click();
    });

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#clienteNombre').clear().type(updatedClienteName);
    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('td', updatedClienteName, { timeout: 30000 }).should('be.visible');
    cy.contains('tr', updatedClienteName, { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar cliente"]').click();
    });

    cy.contains('td', updatedClienteName).should('not.exist');

    cy.contains('button', 'Nuevo Cliente', { timeout: 30000 }).should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#clienteNombre').clear().type(baseClienteName);
    cy.get('#clienteContacto').clear().type('1234567891');
    cy.get('#clienteEmail').clear().type('contacto@mail.com');
    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('tr', baseClienteName, { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Ver Sucursales"]').click();
    });
    cy.contains('td', baseClienteName, { timeout: 30000 })
      .parent()
      .next()
      .find('.cliente-sucursales-wrapper .custom-button')
      .contains('Agregar sucursal')
      .click();

    cy.get('#sucursalNombre', { timeout: 30000 }).clear().type(baseSucursalName);
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', sucursalZone, { timeout: 30000 }).click();
    cy.get('.direccion-autocomplete-input', { timeout: 30000 }).should('not.be.disabled').type('Universidad Católica de Córdoba');
    cy.contains('.direccion-autocomplete-item', suggestionDescription, { timeout: 30000 })
      .should('be.visible')
      .click();
    cy.get('#sucursalSuperficie').clear().type('100');
    cy.get('#sucursalFrecuencia').select('Mensual');
    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('td', baseSucursalName, { timeout: 30000 }).should('be.visible');
    cy.contains('td', sucursalZone, { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'Mensual', { timeout: 30000 }).should('be.visible');
    cy.contains('tr', baseSucursalName, { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Editar sucursal"]').click();
    });

    cy.get('#sucursalNombre', { timeout: 30000 }).clear().type(updatedSucursalName);
    cy.get('.direccion-autocomplete-input', { timeout: 30000 }).should('not.be.disabled').type('Universidad Católica de Córdoba');
    cy.contains('.direccion-autocomplete-item', suggestionDescription, { timeout: 30000 })
      .should('be.visible')
      .click();
    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('td', updatedSucursalName, { timeout: 30000 }).should('be.visible');
    cy.contains('tr', updatedSucursalName, { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar sucursal"]').click();
    });

    cy.contains('td', updatedSucursalName, { timeout: 30000 }).should('not.exist');

    cy.contains('td', baseClienteName, { timeout: 30000 })
      .parent()
      .next()
      .find('.cliente-sucursales-wrapper .custom-button')
      .contains('Agregar sucursal')
      .click();

    cy.get('#sucursalNombre', { timeout: 30000 }).clear().type(baseSucursalName);
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', sucursalZone, { timeout: 30000 }).click();
    cy.get('.direccion-autocomplete-input', { timeout: 30000 }).should('not.be.disabled').type('Universidad Católica de Córdoba');
    cy.contains('.direccion-autocomplete-item', suggestionDescription, { timeout: 30000 })
      .should('be.visible')
      .click();
    cy.get('#sucursalSuperficie').clear().type('100');
    cy.get('#sucursalFrecuencia').select('Mensual');
    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();
  });

  it('permite ocultar columnas mediante el selector', () => {
    cy.stubGoogleGlobals();

    cy.visit('/clientes', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
        setupPlacesStubs(win);
      },
    });

    cy.get('table thead th', { timeout: 30000 }).should('contain', 'ID');

    cy.get('button[aria-label="Seleccionar columnas"]', { timeout: 30000 }).first().click();

    cy.get('.column-selector-modal', { timeout: 30000 }).should('be.visible');
    cy.get('input#col-id', { timeout: 30000 }).should('be.checked').uncheck({ force: true });
    cy.contains('button', 'Guardar', { timeout: 30000 }).click();

    cy.get('table thead th', { timeout: 30000 }).should(($ths) => {
      const texts = Array.from($ths, (th) => th.innerText.trim());
      expect(texts).to.not.include('ID');
    });

    cy.get('button[aria-label="Seleccionar columnas"]', { timeout: 30000 }).first().click();

    cy.get('.column-selector-modal', { timeout: 30000 }).should('be.visible');
    cy.get('input#col-id', { timeout: 30000 }).check();
    cy.contains('button', 'Guardar', { timeout: 30000 }).click();
  });
});
