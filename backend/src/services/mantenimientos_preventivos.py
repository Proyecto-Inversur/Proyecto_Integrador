from sqlalchemy.orm import Session
from api.models import MantenimientoPreventivo, Preventivo, Cuadrilla
from fastapi import HTTPException
from datetime import date, datetime
from typing import Optional

def get_mantenimientos_preventivos(db: Session):
    return db.query(MantenimientoPreventivo).all()

def get_mantenimiento_preventivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    return mantenimiento

def create_mantenimiento_preventivo(db: Session, nombre_sucursal: str, frecuencia: str, id_cuadrilla: int, fecha_apertura: date):
    # Verifica si el preventivo existe
    preventivo = db.query(Preventivo).filter(Preventivo.nombre_sucursal == nombre_sucursal).first()
    if not preventivo:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    
    # Verifica si la cuadrilla existe
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
    if not cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    
    db_mantenimiento = MantenimientoPreventivo(
        nombre_sucursal=nombre_sucursal,
        frecuencia=frecuencia,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura
    )
    db.add(db_mantenimiento)
    db.commit()
    db.refresh(db_mantenimiento)
    return db_mantenimiento

def update_mantenimiento_preventivo(db: Session, mantenimiento_id: int, nombre_sucursal: str, frecuencia: str, id_cuadrilla: int, fecha_apertura: date, fecha_cierre: Optional[date] = None, planilla_1: Optional[str] = None, planilla_2: Optional[str] = None, planilla_3: Optional[str] = None, fotos: Optional[str] = None, extendido: Optional[datetime] = None):
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    
    if nombre_sucursal:
        preventivo = db.query(Preventivo).filter(Preventivo.nombre_sucursal == nombre_sucursal).first()
        if not preventivo:
            raise HTTPException(status_code=404, detail="Preventivo no encontrado")
        db_mantenimiento.nombre_sucursal = nombre_sucursal
    if frecuencia is not None:
        db_mantenimiento.frecuencia = frecuencia
    if id_cuadrilla:
        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
        if not cuadrilla:
            raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
        db_mantenimiento.id_cuadrilla = id_cuadrilla
    if fecha_apertura is not None:
        db_mantenimiento.fecha_apertura = fecha_apertura
    if fecha_cierre is not None:
        db_mantenimiento.fecha_cierre = fecha_cierre
    if planilla_1 is not None:
        db_mantenimiento.planilla_1 = planilla_1
    if planilla_2 is not None:
        db_mantenimiento.planilla_2 = planilla_2
    if planilla_3 is not None:
        db_mantenimiento.planilla_3 = planilla_3
    if fotos is not None:
        db_mantenimiento.fotos = fotos
    if extendido is not None:
        db_mantenimiento.extendido = extendido
    db.commit()
    db.refresh(db_mantenimiento)
    return db_mantenimiento

def delete_mantenimiento_preventivo(db: Session, mantenimiento_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    db.delete(db_mantenimiento)
    db.commit()
    return {"message": f"Mantenimiento preventivo con id {mantenimiento_id} eliminado"}