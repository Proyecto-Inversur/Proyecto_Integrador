from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from api.schemas import SucursalCreate, SucursalUpdate
from config.database import get_db
from services.sucursales import (
    create_sucursal,
    delete_sucursal,
    get_sucursal,
    get_sucursales_by_cliente,
    update_sucursal,
)

router = APIRouter(tags=["sucursales"])


def _serialize_sucursal(sucursal) -> dict:
    return {
        "id": sucursal.id,
        "nombre": sucursal.nombre,
        "zona": sucursal.zona,
        "direccion": sucursal.direccion,
        "superficie": sucursal.superficie,
        "cliente_id": sucursal.cliente_id,
        "frecuencia_preventivo": sucursal.frecuencia_preventivo,
    }


@router.get("/clientes/{cliente_id}/sucursales", response_model=List[dict])
def sucursales_get(cliente_id: int, db: Session = Depends(get_db)):
    sucursales = get_sucursales_by_cliente(db, cliente_id)
    return [_serialize_sucursal(s) for s in sucursales]


@router.post("/clientes/{cliente_id}/sucursales", response_model=dict)
def sucursal_create(cliente_id: int, sucursal: SucursalCreate, request: Request, db: Session = Depends(get_db)):
    if sucursal.cliente_id != cliente_id:
        raise HTTPException(status_code=400, detail="El cliente del cuerpo no coincide con el de la ruta")
    current_entity = request.state.current_entity
    new_sucursal = create_sucursal(
        db,
        cliente_id,
        sucursal.nombre,
        sucursal.zona,
        sucursal.direccion,
        sucursal.superficie,
        sucursal.frecuencia_preventivo.value if sucursal.frecuencia_preventivo else None,
        current_entity,
    )
    return _serialize_sucursal(new_sucursal)


@router.get("/sucursales/{sucursal_id}", response_model=dict)
def sucursal_get(sucursal_id: int, db: Session = Depends(get_db)):
    sucursal = get_sucursal(db, sucursal_id)
    return _serialize_sucursal(sucursal)


@router.put("/sucursales/{sucursal_id}", response_model=dict)
def sucursal_update_endpoint(sucursal_id: int, sucursal: SucursalUpdate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    freq_provided = "frecuencia_preventivo" in sucursal.__fields_set__
    freq_value = sucursal.frecuencia_preventivo.value if sucursal.frecuencia_preventivo else None
    updated_sucursal = update_sucursal(
        db,
        sucursal_id,
        current_entity,
        sucursal.nombre,
        sucursal.zona,
        sucursal.direccion,
        sucursal.superficie,
        freq_value,
        freq_provided,
        sucursal.cliente_id,
    )
    return _serialize_sucursal(updated_sucursal)


@router.delete("/sucursales/{sucursal_id}", response_model=dict)
def sucursal_delete(sucursal_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_sucursal(db, sucursal_id, current_entity)
