from pydantic import BaseModel, EmailStr
from enum import Enum
from datetime import date, datetime
from typing import Optional

# Enum para los roles
class Role(str, Enum):
    ADMIN = "Administrador"
    ENCARGADO = "Encargado de Mantenimiento"
    
# Enum para el estado de los mantenimientos correctivos
class Estado(str, Enum):
    PENDIENTE = "Pendiente"
    EN_PROGRESO = "En Progreso"
    FINALIZADO = "Finalizado"
    APRESUPUESTAR = "A Presupuestar"
    PRESUPUESTADO = "Presupuestado"
    PRESUPUESTOAP = "Presupuesto Aprobado"
    ESPERANDO = "Esperando Respuesta Bancor"
    APLAZADO = "Aplazado"
    DESESTIMADO = "Desestimado"
    SOLUCIONADO = "Solucionado"

# Enum para la prioridad de los mantenimientos correctivos
class Prioridad(str, Enum):
    BAJA = "Baja"
    MEDIA = "Media"
    ALTA = "Alta"

# Enum para el estado de los mantenimientos correctivos
class Rubro(str, Enum):
    ELECTRICIDAD = "Iluminación/Electricidad"
    REFRIGERACION = "Refrigeración"
    ABERTURAS = "Aberturas/Vidrios"
    PINTURA = "Pintura/Impermeabilizaciones"
    PISOS = "Pisos"
    TECHOS = "Techos"
    SANITARIOS = "Sanitarios"
    CERRAJERIA = "Cerrajeria"
    MOBILIARIO = "Mobiliario"
    SENALECTICA = "Senalectica"
    OTROS = "Otros"
    
# Enum para la frecuencia de los preventivos
class Frecuencia(str, Enum):
    MENSUAL = "Mensual"
    TRIMESTRAL = "Trimestral"
    CUATRIMESTRAL = "Cuatrimestral"
    SEMESTRAL = "Semestral"

# Esquemas para Usuario
class UserCreate(BaseModel):
    nombre: str
    email: EmailStr
    rol: Role
    id_token: str

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[Role] = None

# Esquemas para Cuadrilla
class CuadrillaCreate(BaseModel):
    nombre: str
    zona: str
    email: EmailStr
    id_token: str

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

# Esquemas para Preventivo
class PreventivoCreate(BaseModel):
    id_sucursal: int
    nombre_sucursal: str
    frecuencia: Frecuencia

class PreventivoUpdate(BaseModel):
    id_sucursal: Optional[int] = None
    nombre_sucursal: Optional[str] = None
    frecuencia: Optional[Frecuencia] = None
    
# Esquemas para Mantenimiento Preventivo
class MantenimientoPreventivoCreate(BaseModel):
    nombre_sucursal: str
    frecuencia: Frecuencia
    id_cuadrilla: int
    fecha_apertura: date

class MantenimientoPreventivoUpdate(BaseModel):
    nombre_sucursal: Optional[str] = None
    frecuencia: Optional[Frecuencia] = None
    id_cuadrilla: Optional[int] = None
    fecha_apertura: Optional[date] = None
    fecha_cierre: Optional[date] = None
    planilla_1: Optional[str] = None
    planilla_2: Optional[str] = None
    planilla_3: Optional[str] = None
    fotos: Optional[str] = None
    extendido: Optional[datetime] = None

# Esquemas para Mantenimiento Correctivo
class MantenimientoCorrectivoCreate(BaseModel):
    id_sucursal: int
    id_cuadrilla: Optional[int] = None
    fecha_apertura: date
    numero_caso: str
    incidente: str
    rubro: Rubro
    estado: Estado
    prioridad: Prioridad

class MantenimientoCorrectivoUpdate(BaseModel):
    id_sucursal: Optional[int] = None
    id_cuadrilla: Optional[int] = None
    fecha_apertura: Optional[date] = None
    fecha_cierre: Optional[date] = None
    numero_caso: Optional[str] = None
    incidente: Optional[str] = None
    rubro: Optional[Rubro] = None
    planilla: Optional[str] = None
    fotos: Optional[str] = None
    estado: Optional[Estado] = None
    prioridad: Optional[Prioridad] = None
    extendido: Optional[datetime] = None