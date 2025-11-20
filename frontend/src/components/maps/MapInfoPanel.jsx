import { FaTruck, FaUserAlt, FaMapMarkerAlt, FaTimes } from "react-icons/fa"

const MapInfoPanel = ({
  cuadrillas = [],
  encargados = [],
  sucursales = [],
  clientes = [],
  clienteFilter = '',
  onClienteChange = () => {},
  zonas = [],
  zonaSucFilter = '',
  zonaCuaFilter = '',
  onZonaSucChange = () => {},
  onZonaCuaChange = () => {},
  onSelectCuadrilla = () => {},
  onSelectEncargado = () => {},
  onSelectSucursal = () => {},
  showCuadrillas = true,
  showEncargados = true,
  showSucursales = true,
  onClose = () => {}, // Added onClose prop for better UX
}) => (
  <>
    <div className="map-mobile-sidebar-header">
      <h3>Panel de información</h3>
      <button className="sidebar-close" onClick={onClose} aria-label="Cerrar panel">
        <FaTimes size={18} />
      </button>
    </div>
    <div className="sidebar-content">
      {showCuadrillas && (
        <div className="sidebar-section">
          <h4>
            <FaTruck size={18} color="#dfa700" />
            Cuadrillas
          </h4>
          <select
            value={zonaCuaFilter}
            onChange={(e) => onZonaCuaChange(e.target.value)}
            className="map-client-filter w-100 mb-2"
          >
            <option value="">Todas las zonas</option>
            {zonas.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
          {cuadrillas.length === 0 && <p>No hay cuadrillas activas.</p>}
          {cuadrillas.map((cuadrilla) => (
            <div key={cuadrilla.id} className="obra-item" onClick={() => onSelectCuadrilla(cuadrilla)}>
              <strong>{cuadrilla.name}</strong>
              <small>{cuadrilla.correctivos?.length + cuadrilla.preventivos?.length || 0} obras asignadas</small>
            </div>
          ))}
        </div>
      )}

      {showEncargados && (
        <div className="sidebar-section">
          <h4>
            <FaUserAlt size={18} color="#dfa700" />
            Encargados
          </h4>
          {encargados.length === 0 && <p>No hay encargados disponibles.</p>}
          {encargados.map((user) => (
            <div key={user.id} className="obra-item" onClick={() => onSelectEncargado(user)}>
              <strong>{user.name}</strong>
              <small>Encargado de Mantenimiento</small>
            </div>
          ))}
        </div>
      )}

      {showSucursales && (
        <div className="sidebar-section">
          <h4>
            <FaMapMarkerAlt size={18} color="#dfa700" />
            Sucursales
          </h4>
          <select
            value={clienteFilter}
            onChange={(e) => onClienteChange(e.target.value)}
            className="map-client-filter w-100 mb-2"
          >
            <option value="">Todos los clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
          <select
            value={zonaSucFilter}
            onChange={(e) => onZonaSucChange(e.target.value)}
            className="map-client-filter w-100 mb-2"
          >
            <option value="">Todas las zonas</option>
            {zonas.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
          {sucursales.length === 0 && <p>No hay sucursales activas.</p>}
          {sucursales.map((sucursal) => (
            <div key={sucursal.id} className="obra-item" onClick={() => onSelectSucursal(sucursal)}>
              <strong>{sucursal.name}</strong>
              <small>
                {sucursal.Correctivos?.length || 0} correctivos, {sucursal.Preventivos?.length || 0} preventivos
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
)

export default MapInfoPanel
