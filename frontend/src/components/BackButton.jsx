import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons'; // Asegurate de tener esto instalado

const BackButton = ({ label = "" }) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="secondary"
      onClick={() => navigate(-1)}
      className="mb-3 d-flex align-items-center gap-2"
    >
      <ArrowLeft />
      {label}
    </Button>
  );
};

export default BackButton;
