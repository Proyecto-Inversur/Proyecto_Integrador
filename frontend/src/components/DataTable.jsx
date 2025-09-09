import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import ColumnSelector from './ColumnSelector';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { getColumnPreferences, saveColumnPreferences } from '../services/preferencesService';

const DataTable = ({ columns = [], data = [], entityKey, onEdit, onDelete, onRowClick }) => {
  const [selectedColumns, setSelectedColumns] = useState(columns.map(c => c.key));

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await getColumnPreferences(entityKey);
        let cols = response.data?.columns || columns.map(c => c.key);
        if (!cols || cols.length === 0) {
          cols = columns.map(c => c.key);
        }
        setSelectedColumns(cols);
      } catch (e) {
        setSelectedColumns(columns.map(c => c.key));
      }
    };
    loadPreferences();
  }, [entityKey, columns]);

  const handleSaveColumns = async (cols) => {
    setSelectedColumns(cols);
    try {
      await saveColumnPreferences(entityKey, cols);
    } catch (e) {
      console.error('Error saving column preferences', e);
    }
  };

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  return (
    <>
    <div className="mb-1 flex justify-start">
      <ColumnSelector
        availableColumns={columns}
        selectedColumns={selectedColumns}
        onSave={handleSaveColumns}
        />
    </div>
    <div className="table-responsive">
      <Table striped bordered hover>
        <thead>
          <tr>
            {columns.map((col) => (
              selectedColumns.includes(col.key) && (
                <th
                  key={col.key}
                  className={col.key === 'acciones' ? 'acciones-col' : undefined}
                >
                  {col.label}
                </th>
              )
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id || Math.random()}
              onClick={() => handleRowClick(row)}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((col) => (
                selectedColumns.includes(col.key) && (
                  col.key === 'acciones' && (onEdit || onDelete) ? (
                    <td
                      key={col.key}
                      className="action-cell acciones-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onEdit && (
                        <button
                          className="action-btn edit me-2"
                          aria-label="Editar"
                          onClick={() => onEdit(row)}
                        >
                          <FiEdit />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="action-btn delete"
                          aria-label="Eliminar"
                          onClick={() => onDelete(row.id)}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  ) : (
                    <td
                      key={col.key}
                      className={col.key === 'acciones' ? 'acciones-col' : undefined}
                    >
                      {row[col.key]}
                    </td>
                  )
                )
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
    </>
  );
};

export default DataTable;