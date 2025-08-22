from unittest.mock import patch, AsyncMock
import asyncio
import pytest
from fastapi import HTTPException
from src.services import notificaciones as notif_service
from src.api.models import Usuario, Notificacion_Correctivo, Notificacion_Preventivo

def test_notify_user_sends_webpush(db_session):
    with patch("src.services.notificaciones.send_webpush_notification") as mock_push:
        result = notif_service.notify_user(db_session, "uid", 1, "mensaje", "title", "body")
        assert result == {"message": "Notification sent"}
        mock_push.assert_called_once()

def test_notify_users_correctivo_roles(db_session):
    encargado = Usuario(email="enc@example.com", rol="Encargado de Mantenimiento", firebase_uid="enc")
    admin = Usuario(email="adm@example.com", rol="Administrador", firebase_uid="adm")
    db_session.add_all([encargado, admin])
    db_session.commit()

    with patch("src.services.notificaciones.send_notification_correctivo", new=AsyncMock()) as mock_send:
        asyncio.run(notif_service.notify_users_correctivo(db_session, 1, "Solucionado"))
        assert mock_send.await_count == 2
        mock_send.assert_any_await(db_session, "enc", 1, "Solucionado")
        mock_send.assert_any_await(db_session, "adm", 1, "Solucionado")

def test_notify_users_preventivo_roles(db_session):
    encargado = Usuario(email="encp@example.com", rol="Encargado de Mantenimiento", firebase_uid="encp")
    admin = Usuario(email="admp@example.com", rol="Administrador", firebase_uid="admp")
    db_session.add_all([encargado, admin])
    db_session.commit()

    with patch("src.services.notificaciones.send_notification_preventivo", new=AsyncMock()) as mock_send:
        asyncio.run(notif_service.notify_users_preventivo(db_session, 2, "Solucionado"))
        assert mock_send.await_count == 2
        mock_send.assert_any_await(db_session, "encp", 2, "Solucionado")
        mock_send.assert_any_await(db_session, "admp", 2, "Solucionado")

def test_notify_nearby_maintenances_sends_webpush(db_session):
    current = {"data": {"uid": "user"}}
    mantenimientos = [
        {"id": 1, "mensaje": "mc", "tipo": "correctivo"},
        {"id": 2, "mensaje": "mp", "tipo": "preventivo"},
    ]

    with patch(
        "src.services.notificaciones.send_notification_correctivo",
        new=AsyncMock(return_value=True),
    ) as mock_correctivo, patch(
        "src.services.notificaciones.send_notification_preventivo",
        new=AsyncMock(return_value=True),
    ) as mock_preventivo, patch(
        "src.services.notificaciones.send_webpush_notification"
    ) as mock_push:
        result = asyncio.run(
            notif_service.notify_nearby_maintenances(db_session, current, mantenimientos)
        )
        assert result == {"message": "Notificaciones enviadas"}
        mock_correctivo.assert_awaited_once_with(db_session, "user", 1, "mc")
        mock_preventivo.assert_awaited_once_with(db_session, "user", 2, "mp")
        assert mock_push.call_count == 2

def test_get_notification_correctivo(db_session):
    n1 = Notificacion_Correctivo(firebase_uid="uid", id_mantenimiento=1, mensaje="m1")
    n2 = Notificacion_Correctivo(firebase_uid="uid", id_mantenimiento=2, mensaje="m2")
    other = Notificacion_Correctivo(firebase_uid="other", id_mantenimiento=3, mensaje="m3")
    db_session.add_all([n1, n2, other])
    db_session.commit()

    result = notif_service.get_notification_correctivo(db_session, "uid")
    assert len(result) == 2
    assert {n.mensaje for n in result} == {"m1", "m2"}

def test_get_notification_preventivo(db_session):
    n1 = Notificacion_Preventivo(firebase_uid="uid", id_mantenimiento=1, mensaje="p1")
    n2 = Notificacion_Preventivo(firebase_uid="uid", id_mantenimiento=2, mensaje="p2")
    other = Notificacion_Preventivo(firebase_uid="other", id_mantenimiento=3, mensaje="p3")
    db_session.add_all([n1, n2, other])
    db_session.commit()

    result = notif_service.get_notification_preventivo(db_session, "uid")
    assert len(result) == 2
    assert {n.mensaje for n in result} == {"p1", "p2"}

def test_notificacion_correctivo_leida(db_session):
    notif = Notificacion_Correctivo(firebase_uid="uid", id_mantenimiento=1, mensaje="msg")
    db_session.add(notif)
    db_session.commit()

    updated = notif_service.notificacion_correctivo_leida(db_session, notif.id)
    assert updated.leida is True
    assert (
        db_session.query(Notificacion_Correctivo).filter_by(id=notif.id).first().leida
        is True
    )

def test_notificacion_preventivo_leida(db_session):
    notif = Notificacion_Preventivo(firebase_uid="uid", id_mantenimiento=1, mensaje="msg")
    db_session.add(notif)
    db_session.commit()

    updated = notif_service.notificacion_preventivo_leida(db_session, notif.id)
    assert updated.leida is True
    assert (
        db_session.query(Notificacion_Preventivo).filter_by(id=notif.id).first().leida
        is True
    )

def test_send_notification_correctivo(db_session):
    with patch(
        "src.services.notificaciones.notification_manager.send_notification",
        new=AsyncMock(),
    ) as mock_ws:
        created = asyncio.run(
            notif_service.send_notification_correctivo(db_session, "uid", 1, "msg")
        )
        assert created is True
        assert db_session.query(Notificacion_Correctivo).count() == 1
        mock_ws.assert_awaited_once()

        created_again = asyncio.run(
            notif_service.send_notification_correctivo(db_session, "uid", 1, "msg")
        )
        assert created_again is False
        assert db_session.query(Notificacion_Correctivo).count() == 1
        assert mock_ws.await_count == 1

def test_send_notification_preventivo(db_session):
    with patch(
        "src.services.notificaciones.notification_manager.send_notification",
        new=AsyncMock(),
    ) as mock_ws:
        created = asyncio.run(
            notif_service.send_notification_preventivo(db_session, "uid", 1, "msg")
        )
        assert created is True
        assert db_session.query(Notificacion_Preventivo).count() == 1
        mock_ws.assert_awaited_once()

        created_again = asyncio.run(
            notif_service.send_notification_preventivo(db_session, "uid", 1, "msg")
        )
        assert created_again is False
        assert db_session.query(Notificacion_Preventivo).count() == 1
        assert mock_ws.await_count == 1

def test_delete_notificaciones(db_session):
    nc1 = Notificacion_Correctivo(firebase_uid="uid", id_mantenimiento=1, mensaje="m1")
    nc2 = Notificacion_Correctivo(firebase_uid="uid", id_mantenimiento=2, mensaje="m2")
    np1 = Notificacion_Preventivo(firebase_uid="uid", id_mantenimiento=1, mensaje="p1")
    other = Notificacion_Correctivo(firebase_uid="other", id_mantenimiento=3, mensaje="o")
    db_session.add_all([nc1, nc2, np1, other])
    db_session.commit()

    result = notif_service.delete_notificaciones(db_session, "uid")
    assert result == {"message": "Notificaciones eliminadas"}
    assert db_session.query(Notificacion_Correctivo).filter_by(firebase_uid="uid").count() == 0
    assert db_session.query(Notificacion_Preventivo).filter_by(firebase_uid="uid").count() == 0
    assert db_session.query(Notificacion_Correctivo).filter_by(firebase_uid="other").count() == 1

def test_delete_notificacion(db_session):
    nc = Notificacion_Correctivo(firebase_uid="uid", id_mantenimiento=1, mensaje="m")
    np = Notificacion_Preventivo(firebase_uid="uid", id_mantenimiento=2, mensaje="p")
    db_session.add_all([nc, np])
    db_session.commit()

    nc_id = nc.id
    np_id = np.id

    result_c = notif_service.delete_notificacion(db_session, nc_id)
    assert result_c == {"detail": "Notificación eliminada"}
    assert db_session.query(Notificacion_Correctivo).filter_by(id=nc_id).first() is None

    result_p = notif_service.delete_notificacion(db_session, np_id)
    assert result_p == {"detail": "Notificación eliminada"}
    assert db_session.query(Notificacion_Preventivo).filter_by(id=np_id).first() is None

def test_notify_user_already_sent(db_session):
    existing = Notificacion_Correctivo(firebase_uid="uid", id_mantenimiento=1, mensaje="m")
    db_session.add(existing)
    db_session.commit()
    with patch("src.services.notificaciones.send_webpush_notification") as mock_push:
        result = notif_service.notify_user(db_session, "uid", 1, "m", "t", "b")
        assert result == {"message": "Notification already sent"}
        mock_push.assert_not_called()

def test_notify_users_correctivo_no_roles(db_session):
    with patch("src.services.notificaciones.send_notification_correctivo", new=AsyncMock()) as mock_send:
        asyncio.run(notif_service.notify_users_correctivo(db_session, 1, "msg"))
        mock_send.assert_not_awaited()

def test_notify_users_preventivo_no_roles(db_session):
    with patch("src.services.notificaciones.send_notification_preventivo", new=AsyncMock()) as mock_send:
        asyncio.run(notif_service.notify_users_preventivo(db_session, 1, "msg"))
        mock_send.assert_not_awaited()

def test_notify_nearby_maintenances_requires_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(notif_service.notify_nearby_maintenances(db_session, None, []))
    assert exc.value.status_code == 401

def test_get_notification_correctivo_empty(db_session):
    result = notif_service.get_notification_correctivo(db_session, "uid")
    assert result == []

def test_get_notification_preventivo_empty(db_session):
    result = notif_service.get_notification_preventivo(db_session, "uid")
    assert result == []

def test_notificacion_correctivo_leida_not_found(db_session):
    with pytest.raises(AttributeError):
        notif_service.notificacion_correctivo_leida(db_session, 999)

def test_notificacion_preventivo_leida_not_found(db_session):
    with pytest.raises(AttributeError):
        notif_service.notificacion_preventivo_leida(db_session, 999)

def test_send_notification_correctivo_duplicate(db_session):
    with patch(
        "src.services.notificaciones.notification_manager.send_notification",
        new=AsyncMock(),
    ) as mock_ws:
        asyncio.run(notif_service.send_notification_correctivo(db_session, "uid", 1, "m"))
        dup = asyncio.run(notif_service.send_notification_correctivo(db_session, "uid", 1, "m"))
        assert dup is False
        assert db_session.query(Notificacion_Correctivo).count() == 1
        assert mock_ws.await_count == 1

def test_send_notification_preventivo_duplicate(db_session):
    with patch(
        "src.services.notificaciones.notification_manager.send_notification",
        new=AsyncMock(),
    ) as mock_ws:
        asyncio.run(notif_service.send_notification_preventivo(db_session, "uid", 1, "m"))
        dup = asyncio.run(notif_service.send_notification_preventivo(db_session, "uid", 1, "m"))
        assert dup is False
        assert db_session.query(Notificacion_Preventivo).count() == 1
        assert mock_ws.await_count == 1

def test_delete_notificaciones_no_match(db_session):
    other = Notificacion_Correctivo(firebase_uid="other", id_mantenimiento=1, mensaje="m")
    db_session.add(other)
    db_session.commit()
    result = notif_service.delete_notificaciones(db_session, "uid")
    assert result == {"message": "Notificaciones eliminadas"}
    assert db_session.query(Notificacion_Correctivo).filter_by(firebase_uid="other").count() == 1

def test_delete_notificacion_not_found(db_session):
    result = notif_service.delete_notificacion(db_session, 999)
    assert result == {"detail": "No se encontró la notificación"}
