from fastapi import HTTPException
from sqlalchemy.orm import Session
from api.models import Notificacion_Correctivo, Notificacion_Preventivo, Usuario
from .webpush import send_webpush_notification
    
def notify_user(db_session: Session, firebase_uid: str, title: str, body: str):
    send_webpush_notification(db_session, firebase_uid, title, body)
    return {"message": "Notification sent"}

def get_notification_correctivo(db_session: Session, firebase_uid: str):
    return db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.firebase_uid == firebase_uid).all()

def get_notification_preventivo(db_session: Session, firebase_uid: str):
    return db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.firebase_uid == firebase_uid).all()

def notificacion_correctivo_leida(db_session: Session, id_notificacion: int):
    db_notificacion = db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.id == id_notificacion).first()
    db_notificacion.leida = True
    db_session.commit()
    db_session.refresh(db_notificacion)
    return db_notificacion

def notificacion_preventivo_leida(db_session: Session, id_notificacion: int):
    db_notificacion = db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.id == id_notificacion).first()
    db_notificacion.leida = True
    db_session.commit()
    db_session.refresh(db_notificacion)
    return db_notificacion

def send_notification_correctivo(db_session: Session, firebase_uid: str, id_mantenimiento: int, mensaje: str):
    db_notificacion = Notificacion_Correctivo(firebase_uid=firebase_uid, id_mantenimiento=id_mantenimiento, mensaje=mensaje)
    db_session.add(db_notificacion)
    db_session.commit()

def send_notification_preventivo(db_session: Session, firebase_uid: str, id_mantenimiento: int, mensaje: str):
    db_notificacion = Notificacion_Preventivo(firebase_uid=firebase_uid, id_mantenimiento=id_mantenimiento, mensaje=mensaje)
    db_session.add(db_notificacion)
    db_session.commit()

def notify_users_correctivo(db_session: Session, id_mantenimiento: int, mensaje: str, firebase_uid: str = None):
    if firebase_uid is not None:
        send_notification_correctivo(db_session, firebase_uid, id_mantenimiento, mensaje)
    else:
        encargados = db_session.query(Usuario).filter(Usuario.rol == "Encargado de Mantenimiento").all()
        for encargado in encargados:
            send_notification_correctivo(db_session, encargado.firebase_uid, id_mantenimiento, mensaje)

def notify_users_preventivo(db_session: Session, id_mantenimiento: int, mensaje: str, firebase_uid: str = None):
    if firebase_uid is not None:
        send_notification_preventivo(db_session, firebase_uid, id_mantenimiento, mensaje)
    else:
        encargados = db_session.query(Usuario).filter(Usuario.rol == "Encargado de Mantenimiento").all()
        for encargado in encargados:
            send_notification_preventivo(db_session, encargado.firebase_uid, id_mantenimiento, mensaje)

def notify_nearby_maintenances(db_session: Session, current_entity: dict, mantenimientos: list[dict]):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    firebase_uid = current_entity["data"]["uid"]
    for m in mantenimientos:
        if m.get('tipo') == 'correctivo':
            send_notification_correctivo(db_session, firebase_uid, m['id'], m.get('mensaje', ''))
        else:
            send_notification_preventivo(db_session, firebase_uid, m['id'], m.get('mensaje', ''))
        send_webpush_notification(db_session, firebase_uid, 'Mantenimiento cercano', m.get('mensaje', ''))
    return {"message": "Notificaciones enviadas"}

def delete_notificaciones(db_session: Session, firebase_uid: str):
    db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.firebase_uid == firebase_uid).delete()
    db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.firebase_uid == firebase_uid).delete()
    db_session.commit()
    return {"message": "Notificaciones eliminadas"}

def delete_notificacion(db_session: Session, id_notificacion: int):
    # Buscar en correctivos
    noti = db_session.query(Notificacion_Correctivo).filter(Notificacion_Correctivo.id == id_notificacion).first()
    if noti:
        db_session.delete(noti)
        db_session.commit()
        return True

    # Buscar en preventivos
    noti = db_session.query(Notificacion_Preventivo).filter(Notificacion_Preventivo.id == id_notificacion).first()
    if noti:
        db_session.delete(noti)
        db_session.commit()
        return True

    return False  # No encontrada