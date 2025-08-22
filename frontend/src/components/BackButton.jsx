import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import '../styles/boton_back_app.css';
import { FiArrowLeft } from 'react-icons/fi';


const BackButton = ({ to }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button onClick={handleClick} className="floating-back-btn-home">
      <FiArrowLeft size={28} color="white" />
    </button>
  );
};

export default BackButton;