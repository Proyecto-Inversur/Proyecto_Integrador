import React from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import '../styles/direccion-autocomplete.css';

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
    <div className="direccion-autocomplete">
      <input
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Escriba una dirección"
        className="direccion-autocomplete-input"
      />
      {status === 'OK' && (
        <ul className="direccion-autocomplete-suggestions">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="direccion-autocomplete-item"
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
