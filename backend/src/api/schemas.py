from pydantic import BaseModel, EmailStr
from enum import Enum
from datetime import date, datetime
from typing import Optional

# Enum para los roles
class Role(str, Enum):
    ADMIN = "Administrador"
    ENCARGADO = "Encargado de Mantenimiento"

# Esquemas para Usuario
class UserCreate(BaseModel):
    nombre: str
    email: EmailStr
    contrasena: Optional[str] = None
    rol: Role

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[Role] = None

# Esquemas para Cuadrilla
class CuadrillaCreate(BaseModel):
    nombre: str
    zona: str
    email: EmailStr
    contrasena: Optional[str] = None

class CuadrillaUpdate(BaseModel):
    nombre: Optional[str] = None
    zona: Optional[str] = None
    email: Optional[EmailStr] = None

# Esquemas para Zona
class Zona(BaseModel):
    nombre: str

# Esquemas para Sucursal
class SucursalCreate(BaseModel):
    nombre: str
    zona: str
    direccion: str
    superficie: str

class SucursalUpdate(BaseModel):
    nombre: Optional[str] = None
    zona: Optional[str] = None
    direccion: Optional[str] = None
    superficie: Optional[str] = None