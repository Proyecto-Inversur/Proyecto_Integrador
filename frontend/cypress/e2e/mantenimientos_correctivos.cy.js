describe('Modulo de Mantenimientos Correctivos - Integracion', () => {
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

  it('carga la pagina y crea, edita y elimina un mantenimiento correctivo', () => {
    let mantenimientosData = [];
    let mantenimientoIdCounter = 800;

    cy.visit('/mantenimientos-correctivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Mantenimientos Correctivos/i, { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');

    cy.get('#id_sucursal').select('1');
    cy.get('#id_cuadrilla').select('21');
    cy.get('#fecha_apertura').clear().type('2024-03-01');
    cy.get('#numero_caso').clear().type('CASE-001');
    cy.get('#incidente').clear().type('Fuga de agua');
    cy.get('#rubro').select('Sanitarios');
    cy.get('#estado').select('Pendiente');
    cy.get('#prioridad').select('Alta');

    cy.contains('button', 'Guardar').click();

    cy.contains('td', 'Fuga de agua').should('be.visible');
    cy.contains('td', 'Fuga de agua').should('be.visible');

    cy.contains('tr', 'Fuga de agua').within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getCuadrillas');
    cy.wait('@getSucursales');

    const updatedDate = '2024-04-01';
    const updatedCase = 'CASE-002';
    const updatedIncident = 'Rotura de vidrio';

    cy.get('#id_sucursal').select('2');
    cy.get('#id_cuadrilla').select('22');
    cy.get('#fecha_apertura').clear().type(updatedDate);
    cy.get('#numero_caso').clear().type(updatedCase);
    cy.get('#incidente').clear().type(updatedIncident);
    cy.get('#rubro').select('Aberturas/Vidrios');
    cy.get('#estado').select('En Progreso');
    cy.get('#prioridad').select('Media');

    cy.contains('button', 'Guardar').click();

    cy.wait('@updateMantenimientoCorrectivo');
    cy.then(() => {
      const idToUpdate = mantenimientoIdCounter;
      mantenimientosData = mantenimientosData.map((m) =>
        m.id === idToUpdate
          ? {
              ...m,
              id_sucursal: 2,
              id_cuadrilla: 22,
              rubro: 'Aberturas/Vidrios',
              numero_caso: updatedCase,
              fecha_apertura: `${updatedDate}T00:00:00`,
              incidente: updatedIncident,
              estado: 'En Progreso',
              prioridad: 'Media',
            }
          : m
      );
    });
    cy.wait('@getMantenimientosCorrectivos');
    cy.wait('@getCuadrillas');
    cy.wait('@getSucursales');

    cy.contains('td', 'Sucursal Norte', { timeout: 20000 }).should('be.visible');
    cy.contains('td', updatedIncident).should('be.visible');
    cy.contains('td', 'Media').should('be.visible');

    cy.contains('tr', updatedIncident).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });

    cy.wait('@deleteMantenimientoCorrectivo');
    cy.wait('@getMantenimientosCorrectivos');

    cy.contains('td', updatedIncident).should('not.exist');
  });

  it('aplica filtros sobre los mantenimientos correctivos', () => {
    const initialColumns = [
      'id',
      'sucursal',
      'cuadrilla',
      'zona',
      'rubro',
      'numero_caso',
      'fecha_apertura',
      'fecha_cierre',
      'incidente',
      'estado',
      'prioridad',
      'acciones',
    ];
    const sucursalesData = [
      { id: 1, nombre: 'Sucursal Centro', zona: 'Zona Centro' },
      { id: 2, nombre: 'Sucursal Norte', zona: 'Zona Norte' },
    ];
    const zonasData = [
      { id: 1, nombre: 'Zona Centro' },
      { id: 2, nombre: 'Zona Norte' },
    ];
    const cuadrillasData = [
      { id: 21, nombre: 'Cuadrilla Uno' },
      { id: 22, nombre: 'Cuadrilla Dos' },
    ];
    const mantenimientosData = [
      {
        id: 901,
        id_sucursal: 1,
        id_cuadrilla: 21,
        rubro: 'Sanitarios',
        numero_caso: 'CASE-10',
        fecha_apertura: '2024-02-01T00:00:00',
        fecha_cierre: null,
        incidente: 'Reparacion bano',
        estado: 'Pendiente',
        prioridad: 'Alta',
      },
      {
        id: 902,
        id_sucursal: 2,
        id_cuadrilla: 22,
        rubro: 'Aberturas/Vidrios',
        numero_caso: 'CASE-11',
        fecha_apertura: '2024-01-20T00:00:00',
        fecha_cierre: null,
        incidente: 'Puerta danada',
        estado: 'En Progreso',
        prioridad: 'Media',
      },
      {
        id: 903,
        id_sucursal: 2,
        id_cuadrilla: 21,
        rubro: 'Techos',
        numero_caso: 'CASE-12',
        fecha_apertura: '2024-03-15T00:00:00',
        fecha_cierre: null,
        incidente: 'Filtracion',
        estado: 'Solucionado',
        prioridad: 'Baja',
      },
    ];

    cy.intercept('GET', '**/preferences/mantenimientos_correctivos', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getCorrectivoColumnPreferences');

    cy.intercept('GET', '**/mantenimientos-correctivos/', {
      statusCode: 200,
      body: mantenimientosData,
    }).as('getMantenimientosCorrectivos');

    cy.intercept('GET', '**/cuadrillas/', {
      statusCode: 200,
      body: cuadrillasData,
    }).as('getCuadrillas');

    cy.intercept('GET', '**/sucursales/', {
      statusCode: 200,
      body: sucursalesData,
    }).as('getSucursales');

    cy.intercept('GET', '**/zonas/', {
      statusCode: 200,
      body: zonasData,
    }).as('getZonas');

    cy.visit('/mantenimientos-correctivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.wait('@getMantenimientosCorrectivos');
    cy.wait('@getCorrectivoColumnPreferences');
    cy.wait('@getCuadrillas');
    cy.wait('@getSucursales');
    cy.wait('@getZonas');

    cy.contains('button', 'Filtros').should('be.visible').click();

    cy.get('select[name="rubro"]').select('Sanitarios');
    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('td', 'Sanitarios').should('be.visible');

    cy.get('select[name="rubro"]').select('');

    cy.get('select[name="cuadrilla"]').select('21');
    cy.get('table tbody tr').should('have.length', 2);
    cy.get('select[name="cuadrilla"]').select('');

    cy.get('select[name="zona"]').select('Zona Norte');
    cy.get('table tbody tr').should('have.length', 2);
    cy.get('select[name="zona"]').select('');

    cy.get('select[name="prioridad"]').select('alta');
    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('td', 'Alta').should('be.visible');
    cy.get('select[name="prioridad"]').select('');

    cy.get('select[name="estado"]').select('En Progreso');
    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('td', 'En Progreso').should('be.visible');
    cy.get('select[name="estado"]').select('');

    cy.get('select[name="sortByDate"]').select('asc');
    cy.get('table tbody tr').first().within(() => {
      cy.contains('td', '2024-01-20').should('exist');
    });
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
