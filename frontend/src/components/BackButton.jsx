import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';

const BackButton = ({ to, label = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      className="mb-3 d-flex align-items-center gap-2"
    >
      <ArrowLeft />
      {label}
    </Button>
  );
};

export default BackButton;