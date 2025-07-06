import React from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

const DireccionAutocomplete = ({ onSelect }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (description) => {
    setValue(description, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect({ address: description, lat, lng });
    } catch (error) {
      console.error('Error al obtener coordenadas:', error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Escriba una dirección"
        style={{ width: '100%', padding: '8px' }}
      />
      {status === 'OK' && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1000,
            backgroundColor: 'white',
            width: '100%',
            border: '1px solid #ccc',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            listStyle: 'none',
            padding: 0,
          }}
        >
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              style={{ padding: '8px', cursor: 'pointer' }}
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DireccionAutocomplete;