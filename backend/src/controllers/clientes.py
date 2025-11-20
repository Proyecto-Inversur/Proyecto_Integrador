from typing import List

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from api.schemas import ClienteCreate, ClienteResponse, ClienteUpdate
from config.database import get_db
from services.clientes import (
    create_cliente,
    delete_cliente,
    get_cliente,
    get_clientes,
    update_cliente,
)

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("/", response_model=List[ClienteResponse])
def clientes_get(db: Session = Depends(get_db)):
    clientes = get_clientes(db)
    return clientes


@router.get("/{cliente_id}", response_model=ClienteResponse)
def cliente_get(cliente_id: int, db: Session = Depends(get_db)):
    return get_cliente(db, cliente_id)


@router.post("/", response_model=ClienteResponse)
def cliente_create(cliente: ClienteCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return create_cliente(db, cliente.nombre, cliente.contacto, cliente.email, current_entity)


@router.put("/{cliente_id}", response_model=ClienteResponse)
def cliente_update(cliente_id: int, cliente: ClienteUpdate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return update_cliente(db, cliente_id, current_entity, cliente.nombre, cliente.contacto, cliente.email)


@router.delete("/{cliente_id}", response_model=dict)
def cliente_delete(cliente_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_cliente(db, cliente_id, current_entity)
