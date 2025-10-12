import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatSection from '../../src/components/mantenimientos/ChatSection';
import React from 'react';

// Mock de la función URL.createObjectURL, necesaria para las previsualizaciones
const mockCreateObjectURL = vi.fn((file) => `blob:${file.name}`);
vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL });

// --- Props de Prueba ---
const mockMensajes = [
    {
        firebase_uid: 'uid-user-1',
        nombre_usuario: 'Usuario A',
        texto: '¡Hola! Mensaje recibido.',
        fecha: '2025-10-01T10:00:00Z',
    },
    {
        firebase_uid: 'uid-current',
        nombre_usuario: 'Yo',
        texto: 'Respuesta propia con texto.',
        fecha: '2025-10-01T10:01:00Z',
    },
    {
        firebase_uid: 'uid-current',
        nombre_usuario: 'Yo',
        archivo: 'http://server/foto.jpg',
        fecha: '2025-10-01T10:02:00Z',
    },
    {
        firebase_uid: 'uid-user-2',
        nombre_usuario: 'Usuario B',
        archivo: 'http://server/documento.pdf',
        fecha: '2025-10-01T10:03:00Z',
    },
];

const setNuevoMensaje = vi.fn();
const setArchivoAdjunto = vi.fn();
const setPreviewArchivoAdjunto = vi.fn();
const onEnviarMensaje = vi.fn();
const mockChatBoxRef = { current: document.createElement('div') };

const renderChatSection = (props = {}) => {
    const defaultProps = {
        mensajes: mockMensajes,
        nuevoMensaje: '',
        setNuevoMensaje,
        archivoAdjunto: null,
        setArchivoAdjunto,
        previewArchivoAdjunto: null,
        setPreviewArchivoAdjunto,
        onEnviarMensaje,
        chatBoxRef: mockChatBoxRef,
        currentUid: 'uid-current',
        ...props,
    };
    return render(<ChatSection {...defaultProps} />);
};

const mockImageFile = new File(['(⌐■_■)'], 'test-image.png', { type: 'image/png' });
const mockVideoFile = new File(['(🎥)'], 'test-video.mp4', { type: 'video/mp4' });
const mockPdfFile = new File(['(📄)'], 'test-doc.pdf', { type: 'application/pdf' });

describe('ChatSection', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateObjectURL.mockClear();
    });

    // ----------------------------------------
    // Renderizado de Mensajes (Chat-Box)
    // ----------------------------------------

    it('debe renderizar todos los mensajes y clasificar correctamente los propios/recibidos', () => {
        renderChatSection();

        const messageElements = document.querySelectorAll('.chat-message');
        expect(messageElements.length).toBe(mockMensajes.length);

        const userAElement = screen.getByText((content, element) => {
            return element?.textContent?.includes('Usuario A') && element.className.includes('chat-info');
        }).closest('.chat-message');
        expect(userAElement).toHaveClass('chat-message-received');

        const myTextElement = screen.getByText('Respuesta propia con texto.').closest('.chat-message');
        expect(myTextElement).toHaveClass('chat-message-sent');
    });

    it('debe renderizar archivos adjuntos como imagen si coincide con la extensión', () => {
        renderChatSection();
        const imageMsg = screen.getByAltText('Adjunto');
        expect(imageMsg).toBeInTheDocument();
        expect(imageMsg.tagName).toBe('IMG');
    });

    it('debe renderizar archivos adjuntos como enlace si NO son imagen', () => {
        renderChatSection();
        const fileLink = screen.getByRole('link', { name: 'Archivo adjunto' });
        expect(fileLink).toBeInTheDocument();
        expect(fileLink).toHaveAttribute('href', 'http://server/documento.pdf');
    });

    // ----------------------------------------
    // Interacción de Input y Envío
    // ----------------------------------------

    it('debe llamar a onEnviarMensaje cuando se presiona el botón de envío', async () => {
        renderChatSection({ nuevoMensaje: 'Test listo para enviar' });
        const sendButton = screen.getByRole('button', { name: '' });

        await user.click(sendButton);
        expect(onEnviarMensaje).toHaveBeenCalledTimes(1);
    });

    // ----------------------------------------
    // Manejo de Archivos Adjuntos (Botón de Adjuntar)
    // ----------------------------------------

    it('debe manejar la adjunción de un archivo al hacer clic en el botón de adjuntar', async () => {
        renderChatSection();
        const attachButton = screen.getByLabelText('📎');
        const fileInput = attachButton.nextElementSibling;

        await user.upload(fileInput, mockImageFile);

        expect(setArchivoAdjunto).toHaveBeenCalledWith(mockImageFile);
        expect(setPreviewArchivoAdjunto).toHaveBeenCalled();
    });

    it('debe mostrar la previsualización de la imagen cargada en la sección de envío', () => {
        renderChatSection({
            archivoAdjunto: mockImageFile,
            previewArchivoAdjunto: 'blob:test-image.png'
        });

        expect(screen.getByText('Archivo a enviar:')).toBeInTheDocument();
        const previewImage = screen.getByAltText('preview');
        expect(previewImage).toBeInTheDocument();
    });

    it('debe mostrar el nombre del archivo si no es imagen ni video', async () => {
        renderChatSection({
            archivoAdjunto: mockPdfFile,
            previewArchivoAdjunto: mockPdfFile.name
        });

        expect(screen.getByText(mockPdfFile.name)).toBeInTheDocument();
    });
});