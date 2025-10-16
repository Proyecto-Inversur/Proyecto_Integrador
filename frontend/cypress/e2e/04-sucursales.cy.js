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
    cy.window().then(() => {});
  });

  it('carga la pagina y crea, edita y elimina una sucursal', () => {
    const baseSucursalName = 'Sucursal E2E';
    const updatedSucursalName = `${baseSucursalName} Editada`;
    const suggestionDescription = 'Universidad Católica de Córdoba - Campus Universitario, Avenida Armada Argentina, Córdoba, Argentina';
    const sucursalZone = 'Zona E2E';

    cy.stubGoogleGlobals();

    cy.visit('/sucursales', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
        setupPlacesStubs(win);
      },
    });

    cy.contains(/Sucursales/i, { timeout: 30000 }).should('be.visible');

    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#nombre').clear().type(baseSucursalName);
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', sucursalZone).click();

    cy.get('.direccion-autocomplete-input').should('not.be.disabled').type('Universidad Católica de Córdoba');
    cy.contains('.direccion-autocomplete-item', suggestionDescription, { timeout: 30000 })
      .should('be.visible')
      .click();

    cy.get('#superficie').clear().type('100');

    cy.contains('button', 'Guardar').should('be.enabled').click();

    cy.contains('td', baseSucursalName, { timeout: 30000 }).should('be.visible');
    cy.contains('td', sucursalZone).should('be.visible');
    cy.contains('tr', baseSucursalName).within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#nombre').clear().type(updatedSucursalName);
    cy.get('.direccion-autocomplete-input').should('not.be.disabled').type('Universidad Católica de Córdoba');
    cy.contains('.direccion-autocomplete-item', suggestionDescription, { timeout: 30000 })
      .should('be.visible')
      .click();

    cy.contains('button', 'Guardar').should('be.enabled').click();

    cy.contains('td', updatedSucursalName, { timeout: 30000 }).should('be.visible');
    cy.contains('tr', updatedSucursalName).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.contains('td', updatedSucursalName).should('not.exist');

    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    cy.get('#nombre').clear().type(baseSucursalName);
    cy.get('#dropdown-zona').click();
    cy.contains('.custom-dropdown-item', sucursalZone).click();

    cy.get('.direccion-autocomplete-input').should('not.be.disabled').type('Universidad Católica de Córdoba');
    cy.contains('.direccion-autocomplete-item', suggestionDescription, { timeout: 30000 })
      .should('be.visible')
      .click();

    cy.get('#superficie').clear().type('100');

    cy.contains('button', 'Guardar').should('be.enabled').click();
  });

  it('permite ocultar columnas mediante el selector', () => {
    cy.stubGoogleGlobals();

    cy.visit('/sucursales', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
        setupPlacesStubs(win);
      },
    });

    cy.get('table thead th').should('contain', 'ID');

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-id').should('be.checked').uncheck({ force: true });
    cy.contains('button', 'Guardar').click();

    cy.get('table thead th').should(($ths) => {
      const texts = Array.from($ths, (th) => th.innerText.trim());
      expect(texts).to.not.include('ID');
    });

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-id').check();
    cy.contains('button', 'Guardar').click();
  });
});
