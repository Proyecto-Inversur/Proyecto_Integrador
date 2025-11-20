import { Fragment } from 'react';
import { Button, Container, Row, Col, Table, Collapse, Alert } from 'react-bootstrap';
import { FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FiEdit, FiTrash2, FiHome } from 'react-icons/fi';
import ClienteForm from '../components/forms/ClienteForm';
import SucursalForm from '../components/forms/SucursalForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ColumnSelector from '../components/ColumnSelector';
import useClientes from '../hooks/forms/useClientes';
import '../styles/botones_forms.css';

const clientColumns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'contacto', label: 'Telefono' },
  { key: 'email', label: 'Email' },
  { key: 'acciones', label: 'Acciones' },
];

const sucursalColumns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'zona', label: 'Zona' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'frecuencia', label: 'Frecuencia preventivo' },
  { key: 'acciones', label: 'Acciones' },
];

const Clientes = () => {
  const {
    clientes,
    loading,
    error_cliente,
    error_sucursal,
    success_cliente,
    success_sucursal,
    showClienteForm,
    setShowClienteForm,
    selectedCliente,
    expandedCliente,
    sucursalesMap,
    activeSucursalForm,
    setActiveSucursalForm,
    loadingSucursales,
    selectedClientColumns,
    selectedSucursalColumns,
    handleOpenClienteForm,
    handleDeleteCliente,
    handleClienteSaved,
    toggleClienteRow,
    handleOpenSucursalForm,
    handleDeleteSucursal,
    handleSucursalSaved,
    handleSaveClientColumns,
    handleSaveSucursalColumns,
    setError_cliente,
    setError_sucursal,
    setSuccess_cliente,
    setSuccess_sucursal
  } = useClientes();

  const renderSucursales = (cliente) => {
    const sucursales = sucursalesMap[cliente.id] || [];
    return (
      <div className="cliente-sucursales-wrapper">
        <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
          <h5 className="mb-0">
            <FiHome className="me-2" />
            Sucursales de {cliente.nombre}
          </h5>
          <div className="d-flex align-items-center gap-2">
            <Button
              data-cy="btn-agregar-sucursal"
              size="sm"
              className="custom-button"
              onClick={() => handleOpenSucursalForm(cliente.id)}
            >
              <FaPlus className="me-1" />
              Agregar sucursal
            </Button>
          </div>
        </div>
        {error_sucursal && <Alert variant="danger">{error_sucursal}</Alert>}
        {success_sucursal && <Alert variant="success" className="mt-3">{success_sucursal}</Alert>}
        {activeSucursalForm?.clienteId === cliente.id && (
          <SucursalForm
            inline
            clienteId={cliente.id}
            sucursal={activeSucursalForm.sucursal}
            onClose={() => setActiveSucursalForm(null)}
            onSaved={() => handleSucursalSaved(cliente.id)}
            title={activeSucursalForm.sucursal ? 'Editar sucursal' : 'Crear sucursal'}
            setError={setError_sucursal}
            setSuccess={setSuccess_sucursal}
          />
        )}
        <ColumnSelector
          availableColumns={sucursalColumns}
          selectedColumns={selectedSucursalColumns}
          onSave={handleSaveSucursalColumns}
        />
        {loadingSucursales && !sucursales.length ? (
          <div className="py-3 text-center">Cargando sucursales...</div>
        ) : sucursales.length ? (
          <div className="table-responsive">
            <Table bordered size="sm">
              <thead>
                <tr>
                  {sucursalColumns.map(
                    (column) =>
                      selectedSucursalColumns.includes(column.key) && (
                        <th
                          key={column.key}
                          className={column.key === 'acciones' ? 'acciones-col' : undefined}
                        >
                          {column.label}
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody>
                {sucursales.map((sucursal) => (
                  <tr key={sucursal.id}>
                    {selectedSucursalColumns.includes('id') && <td>{sucursal.id}</td>}
                    {selectedSucursalColumns.includes('nombre') && <td>{sucursal.nombre}</td>}
                    {selectedSucursalColumns.includes('zona') && <td>{sucursal.zona || '—'}</td>}
                    {selectedSucursalColumns.includes('direccion') && (
                      <td>{typeof sucursal.direccion === 'string' ? sucursal.direccion : sucursal.direccion?.address}</td>
                    )}
                    {selectedSucursalColumns.includes('frecuencia') && (
                      <td>{sucursal.frecuencia_preventivo || 'Sin preventivo'}</td>
                    )}
                    {selectedSucursalColumns.includes('acciones') && (
                      <td className="acciones-col">
                        <button
                          className="action-btn edit me-2"
                          onClick={() => handleOpenSucursalForm(cliente.id, sucursal)}
                          aria-label="Editar sucursal"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteSucursal(cliente.id, sucursal.id)}
                          aria-label="Eliminar sucursal"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="text-muted py-3">Este cliente todavía no tiene sucursales.</div>
        )}
      </div>
    );
  };

  return (
    <Container className="custom-container">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="contenido-wrapper">
          <Row className="align-items-center mb-3">
            <Col>
              <h2>Gestión de Clientes</h2>
            </Col>
            <Col className="text-end">
              <div className="d-inline-flex align-items-center gap-2">
                <Button className="custom-button" onClick={() => handleOpenClienteForm(null)}>
                  <FaPlus className="me-2" />
                  Nuevo Cliente
                </Button>
              </div>
            </Col>
          </Row>
          {error_cliente && <Alert variant="danger">{error_cliente}</Alert>}
          {success_cliente && <Alert variant="success" className="mt-3">{success_cliente}</Alert>}
          <ColumnSelector
            availableColumns={clientColumns}
            selectedColumns={selectedClientColumns}
            onSave={handleSaveClientColumns}
          />
          <div className="table-responsive">
            <Table bordered hover>
              <thead>
                <tr>
                  {clientColumns.map(
                    (column) =>
                      selectedClientColumns.includes(column.key) && (
                        <th
                          key={column.key}
                          className={column.key === 'acciones' ? 'acciones-col' : undefined}
                        >
                          {column.label}
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <Fragment key={cliente.id}>
                    <tr>
                      {selectedClientColumns.includes('id') && <td>{cliente.id}</td>}
                      {selectedClientColumns.includes('nombre') && <td>{cliente.nombre}</td>}
                      {selectedClientColumns.includes('contacto') && <td>{cliente.contacto}</td>}
                      {selectedClientColumns.includes('email') && <td>{cliente.email}</td>}
                      {selectedClientColumns.includes('acciones') && (
                        <td className="acciones-col-clientes">
                          <button
                            className={`view-sucursales-btn ${expandedCliente === cliente.id ? 'active' : ''}`}
                            onClick={() => toggleClienteRow(cliente.id)}
                            aria-label="Ver Sucursales"
                          >
                            {expandedCliente === cliente.id ? (
                              <>
                                <FaChevronUp className="me-1" />
                                Ocultar sucursales
                              </>
                            ) : (
                              <>
                                <FaChevronDown className="me-1" />
                                Ver sucursales
                              </>
                            )}
                          </button>
                          <button
                            className="action-btn edit me-2"
                            onClick={() => handleOpenClienteForm(cliente)}
                            aria-label="Editar cliente"
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteCliente(cliente.id)}
                            aria-label="Eliminar cliente"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td colSpan={selectedClientColumns.length} className="p-0">
                        <Collapse in={expandedCliente === cliente.id}>
                          <div className="p-3">{renderSucursales(cliente)}</div>
                        </Collapse>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
      {showClienteForm && (
        <ClienteForm
          show={showClienteForm}
          cliente={selectedCliente}
          onClose={() => setShowClienteForm(false)}
          onSaved={handleClienteSaved}
          setError={setError_cliente}
          setSuccess={setSuccess_cliente}
        />
      )}
    </Container>
  );
};

export default Clientes;
