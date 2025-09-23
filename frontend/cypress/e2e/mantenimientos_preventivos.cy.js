describe('Modulo de Mantenimientos Preventivos - Integracion', () => {
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

  it('carga la pagina y crea, edita y elimina un mantenimiento preventivo', () => {
    const initialColumns = ['id', 'preventivo', 'cuadrilla', 'zona', 'fecha_apertura', 'fecha_cierre', 'acciones'];
    const sucursalesData = [
      { id: 1, nombre: 'Sucursal Centro', zona: 'Zona Centro' },
      { id: 2, nombre: 'Sucursal Norte', zona: 'Zona Norte' },
    ];
    const zonasData = [
      { id: 1, nombre: 'Zona Centro' },
      { id: 2, nombre: 'Zona Norte' },
    ];
    const cuadrillasData = [
      { id: 11, nombre: 'Cuadrilla Alfa' },
      { id: 12, nombre: 'Cuadrilla Beta' },
    ];
    const preventivosData = [
      { id: 101, id_sucursal: 1, nombre_sucursal: 'Sucursal Centro', frecuencia: 'Mensual' },
      { id: 102, id_sucursal: 2, nombre_sucursal: 'Sucursal Norte', frecuencia: 'Semestral' },
    ];
    let mantenimientosData = [];
    let mantenimientoIdCounter = 600;

    cy.intercept('GET', '**/preferences/mantenimientos_preventivos', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getPreventivoColumnPreferences');

    cy.intercept('PUT', '**/preferences/mantenimientos_preventivos', (req) => {
      req.alias = 'savePreventivoColumnPreferences';
      req.reply({ statusCode: 200, body: { columns: req.body.columns } });
    });

    cy.intercept('GET', '**/mantenimientos-preventivos/', (req) => {
      req.reply({ statusCode: 200, body: mantenimientosData });
    }).as('getMantenimientosPreventivos');

    cy.intercept('GET', '**/preventivos/', {
      statusCode: 200,
      body: preventivosData,
    }).as('getPreventivos');

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

    cy.intercept('POST', '**/mantenimientos-preventivos/', (req) => {
      mantenimientoIdCounter += 1;
      const nuevo = {
        id: mantenimientoIdCounter,
        id_sucursal: req.body.id_sucursal,
        id_cuadrilla: req.body.id_cuadrilla,
        frecuencia: req.body.frecuencia,
        fecha_apertura: `${req.body.fecha_apertura}T00:00:00`,
        fecha_cierre: null,
        estado: req.body.estado,
      };
      mantenimientosData = [...mantenimientosData, nuevo];
      req.reply({ statusCode: 201, body: nuevo });
    }).as('createMantenimientoPreventivo');

    cy.intercept('PUT', '**/mantenimientos-preventivos/*', (req) => {
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('updateMantenimientoPreventivo');

    cy.intercept('DELETE', '**/mantenimientos-preventivos/*', (req) => {
      const id = Number(req.url.split('/').pop());
      mantenimientosData = mantenimientosData.filter((m) => m.id !== id);
      req.reply({ statusCode: 200, body: { success: true } });
    }).as('deleteMantenimientoPreventivo');

    cy.visit('/mantenimientos-preventivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.wait('@getMantenimientosPreventivos');
    cy.wait('@getPreventivoColumnPreferences');
    cy.wait('@getCuadrillas');
    cy.wait('@getSucursales');
    cy.wait('@getZonas');

    cy.contains(/Mantenimientos Preventivos/i, { timeout: 20000 }).should('be.visible');
    cy.contains('button', 'Agregar').should('be.visible').click();

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getPreventivos');
    cy.wait('@getCuadrillas');
    cy.wait('@getSucursales');

    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item', 'Sucursal Centro - Mensual').click();

    cy.get('select[name="id_cuadrilla"]').select('11');
    cy.get('input[name="fecha_apertura"]').type('2024-05-10');

    cy.contains('button', 'Guardar').click();

    cy.wait('@createMantenimientoPreventivo');
    cy.wait('@getMantenimientosPreventivos');

    cy.contains('td', 'Sucursal Centro - Mensual', { timeout: 20000 }).should('be.visible');
    cy.contains('td', 'Cuadrilla Alfa').should('be.visible');

    cy.contains('tr', 'Sucursal Centro - Mensual').within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 10000 }).should('be.visible');
    cy.wait('@getPreventivos');
    cy.wait('@getCuadrillas');
    cy.wait('@getSucursales');

    const updatedDate = '2024-06-15';

    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item', 'Sucursal Norte - Semestral').click();
    cy.get('select[name="id_cuadrilla"]').select('12');
    cy.get('input[name="fecha_apertura"]').clear().type(updatedDate);

    cy.contains('button', 'Guardar').click();

    cy.wait('@updateMantenimientoPreventivo');
    cy.then(() => {
      const idToUpdate = mantenimientoIdCounter;
      mantenimientosData = mantenimientosData.map((m) =>
        m.id === idToUpdate
          ? {
              ...m,
              id_sucursal: 2,
              id_cuadrilla: 12,
              frecuencia: 'Semestral',
              fecha_apertura: `${updatedDate}T00:00:00`,
            }
          : m
      );
    });
    cy.wait('@getMantenimientosPreventivos');

    cy.contains('td', 'Sucursal Norte - Semestral', { timeout: 20000 }).should('be.visible');
    cy.contains('td', 'Cuadrilla Beta').should('be.visible');

    cy.contains('tr', 'Sucursal Norte - Semestral').within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });

    cy.wait('@deleteMantenimientoPreventivo');
    cy.wait('@getMantenimientosPreventivos');

    cy.contains('td', 'Sucursal Norte - Semestral').should('not.exist');
  });

  it('aplica filtros sobre los mantenimientos preventivos', () => {
    const initialColumns = ['id', 'preventivo', 'cuadrilla', 'zona', 'fecha_apertura', 'fecha_cierre', 'acciones'];
    const sucursalesData = [
      { id: 1, nombre: 'Sucursal Centro', zona: 'Zona Centro' },
      { id: 2, nombre: 'Sucursal Norte', zona: 'Zona Norte' },
    ];
    const zonasData = [
      { id: 1, nombre: 'Zona Centro' },
      { id: 2, nombre: 'Zona Norte' },
    ];
    const cuadrillasData = [
      { id: 11, nombre: 'Cuadrilla Alfa' },
      { id: 12, nombre: 'Cuadrilla Beta' },
    ];
    const preventivosData = [
      { id: 201, id_sucursal: 1, nombre_sucursal: 'Sucursal Centro', frecuencia: 'Mensual' },
      { id: 202, id_sucursal: 2, nombre_sucursal: 'Sucursal Norte', frecuencia: 'Semestral' },
    ];
    let mantenimientosData = [
      {
        id: 701,
        id_sucursal: 1,
        id_cuadrilla: 11,
        frecuencia: 'Mensual',
        fecha_apertura: '2024-04-10T00:00:00',
        fecha_cierre: null,
        estado: 'Pendiente',
      },
      {
        id: 702,
        id_sucursal: 2,
        id_cuadrilla: 12,
        frecuencia: 'Semestral',
        fecha_apertura: '2024-01-05T00:00:00',
        fecha_cierre: null,
        estado: 'Pendiente',
      },
    ];

    cy.intercept('GET', '**/preferences/mantenimientos_preventivos', {
      statusCode: 200,
      body: { columns: initialColumns },
    }).as('getPreventivoColumnPreferences');

    cy.intercept('GET', '**/mantenimientos-preventivos/', (req) => {
      req.reply({ statusCode: 200, body: mantenimientosData });
    }).as('getMantenimientosPreventivos');

    cy.intercept('GET', '**/preventivos/', {
      statusCode: 200,
      body: preventivosData,
    }).as('getPreventivos');

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

    cy.visit('/mantenimientos-preventivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.wait('@getMantenimientosPreventivos');
    cy.wait('@getPreventivoColumnPreferences');
    cy.wait('@getCuadrillas');
    cy.wait('@getSucursales');
    cy.wait('@getZonas');

    cy.contains('button', 'Filtros').should('be.visible').click();

    cy.get('select[name="sucursal"]').select('2');
    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('td', 'Sucursal Norte - Semestral').should('be.visible');

    cy.get('select[name="sucursal"]').select('');
    cy.get('table tbody tr').should('have.length', 2);

    cy.get('select[name="zona"]').select('Zona Centro');
    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('td', 'Sucursal Centro - Mensual').should('be.visible');

    cy.get('select[name="zona"]').select('');
    cy.get('select[name="sortByDate"]').select('asc');
    cy.get('table tbody tr').should('have.length', 2);
    cy.get('table tbody tr').first().within(() => {
      cy.contains('td', '2024-01-05').should('exist');
    });
  });
});
