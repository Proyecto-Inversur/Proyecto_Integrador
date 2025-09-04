import React from 'react';
import { Button } from 'react-bootstrap';
import { FiSend } from 'react-icons/fi';

const ChatSection = ({
  mensajes,
  nuevoMensaje,
  setNuevoMensaje,
  archivoAdjunto,
  setArchivoAdjunto,
  previewArchivoAdjunto,
  setPreviewArchivoAdjunto,
  onEnviarMensaje,
  chatBoxRef,
  currentUid,
}) => (
  <>
    <div className="chat-box" ref={chatBoxRef}>
      {mensajes.map((msg, index) => {
        const esPropio = msg.firebase_uid === currentUid;
        const esImagen = msg.archivo?.match(/\.(jpeg|jpg|png|gif)$/i);
        return (
          <div
            key={index}
            className={`chat-message ${esPropio ? 'chat-message-sent' : 'chat-message-received'}`}
          >
            {msg.texto && <p className="chat-message-text">{msg.texto}</p>}
            {msg.archivo && (
              esImagen ? (
                <img src={msg.archivo} alt="Adjunto" className="chat-image-preview" />
              ) : (
                <a
                  href={msg.archivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-file-link"
                >
                  Archivo adjunto
                </a>
              )
            )}
            <span className="chat-info">
              {msg.nombre_usuario} · {new Date(msg.fecha).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
    {archivoAdjunto && (
      <div style={{ marginTop: '0.5rem' }}>
        <strong>Archivo a enviar:</strong>
        <br />
        {archivoAdjunto.type.startsWith('image/') && (
          <img
            src={previewArchivoAdjunto}
            alt="preview"
            style={{ maxWidth: '100px', borderRadius: '8px' }}
          />
        )}
        {archivoAdjunto.type.startsWith('video/') && (
          <video controls style={{ maxWidth: '120px', borderRadius: '8px' }}>
            <source src={previewArchivoAdjunto} type={archivoAdjunto.type} />
            Tu navegador no soporta videos.
          </video>
        )}
        {!archivoAdjunto.type.startsWith('image/') &&
          !archivoAdjunto.type.startsWith('video/') && <span>{archivoAdjunto.name}</span>}
      </div>
    )}
    <div className="chat-input-form">
      <input
        type="text"
        placeholder="Escribe un mensaje..."
        className="chat-input"
        value={nuevoMensaje}
        onChange={(e) => setNuevoMensaje(e.target.value)}
      />
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files[0];
          setArchivoAdjunto(file);
          if (file && file.type.startsWith('image/')) {
            setPreviewArchivoAdjunto(URL.createObjectURL(file));
          } else if (file && file.type.startsWith('video/')) {
            setPreviewArchivoAdjunto(URL.createObjectURL(file));
          } else {
            setPreviewArchivoAdjunto(file ? file.name : null);
          }
        }}
        style={{ display: 'none' }}
        id="archivoAdjunto"
      />
      <label htmlFor="archivoAdjunto" className="chat-attach-btn">
        📎
      </label>
      <Button variant="light" className="chat-send-btn" onClick={onEnviarMensaje}>
        <FiSend size={20} color="black" />
      </Button>
    </div>
  </>
);

export default ChatSection;