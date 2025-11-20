from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base
from datetime import datetime
from zoneinfo import ZoneInfo

Base = declarative_base()

class Zona(Base):
    __tablename__ = "zona"
    id = Column(Integer, primary_key=True)
    nombre = Column(String, unique=True, nullable=False)

class Cliente(Base):
    __tablename__ = "cliente"
    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    contacto = Column(String, nullable=False)
    email = Column(String, nullable=False)

    sucursales = relationship("Sucursal", back_populates="cliente", cascade="all, delete-orphan")

class Sucursal(Base):
    __tablename__ = "sucursal"
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    zona = Column(String)
    direccion = Column(String)
    superficie = Column(String)
    cliente_id = Column(Integer, ForeignKey("cliente.id"), nullable=False)
    frecuencia_preventivo = Column(String, nullable=True)
    
    cliente = relationship("Cliente", back_populates="sucursales")
    mantenimientos_preventivos = relationship("MantenimientoPreventivo", back_populates="sucursal")
    mantenimientos_correctivos = relationship("MantenimientoCorrectivo", back_populates="sucursal")
    correctivo_seleccionado = relationship("CorrectivoSeleccionado", back_populates="sucursal")
    preventivo_seleccionado = relationship("PreventivoSeleccionado", back_populates="sucursal")

class Cuadrilla(Base):
    __tablename__ = "cuadrilla"
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    zona = Column(String)
    email = Column(String, unique=True, nullable=False)
    firebase_uid = Column(String, unique=True, nullable=True)  # ID de Firebase
    
    mantenimientos_preventivos = relationship("MantenimientoPreventivo", back_populates="cuadrilla")
    mantenimientos_correctivos = relationship("MantenimientoCorrectivo", back_populates="cuadrilla")
    correctivo_seleccionado = relationship("CorrectivoSeleccionado", back_populates="cuadrilla")
    preventivo_seleccionado = relationship("PreventivoSeleccionado", back_populates="cuadrilla")

class MantenimientoPreventivo(Base):
    __tablename__ = "mantenimiento_preventivo"
    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("cliente.id"), nullable=False)
    sucursal_id = Column(Integer, ForeignKey("sucursal.id"), nullable=False)
    frecuencia = Column(String)
    id_cuadrilla = Column(Integer, ForeignKey("cuadrilla.id"))
    fecha_apertura = Column(Date)
    fecha_cierre = Column(Date, nullable=True)
    extendido = Column(DateTime, nullable=True)
    estado = Column(String)

    cliente = relationship("Cliente")
    sucursal = relationship("Sucursal", back_populates="mantenimientos_preventivos")
    cuadrilla = relationship("Cuadrilla", back_populates="mantenimientos_preventivos")
    preventivo_seleccionado = relationship("PreventivoSeleccionado", back_populates="mantenimiento_preventivo")
    notificacion_preventivo = relationship("Notificacion_Preventivo", back_populates="mantenimiento_preventivo")
    mensaje_preventivo = relationship("MensajePreventivo", backref="mantenimiento")
    planillas = relationship("MantenimientoPreventivoPlanilla", backref="mantenimiento")
    fotos = relationship("MantenimientoPreventivoFoto", backref="mantenimiento")
    
class MantenimientoPreventivoPlanilla(Base):
    __tablename__ = "mantenimiento_preventivo_planilla"
    id = Column(Integer, primary_key=True)
    mantenimiento_id = Column(Integer, ForeignKey("mantenimiento_preventivo.id"))
    url = Column(String, nullable=False)

class MantenimientoPreventivoFoto(Base):
    __tablename__ = "mantenimiento_preventivo_foto"
    id = Column(Integer, primary_key=True)
    mantenimiento_id = Column(Integer, ForeignKey("mantenimiento_preventivo.id"))
    url = Column(String, nullable=False)

class MantenimientoCorrectivo(Base):
    __tablename__ = "mantenimiento_correctivo"
    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("cliente.id"), nullable=False)
    sucursal_id = Column(Integer, ForeignKey("sucursal.id"), nullable=False)
    id_cuadrilla = Column(Integer, ForeignKey("cuadrilla.id"))
    fecha_apertura = Column(Date)
    fecha_cierre = Column(Date, nullable=True)
    numero_caso = Column(String)
    incidente = Column(String)
    rubro = Column(String)
    planilla = Column(String)
    estado = Column(String)
    prioridad = Column(String)
    extendido = Column(DateTime, nullable=True)
    
    cliente = relationship("Cliente")
    sucursal = relationship("Sucursal", back_populates="mantenimientos_correctivos")
    cuadrilla = relationship("Cuadrilla", back_populates="mantenimientos_correctivos")
    correctivo_seleccionado = relationship("CorrectivoSeleccionado", back_populates="mantenimiento_correctivo")
    notificacion_correctivo = relationship("Notificacion_Correctivo", back_populates="mantenimiento_correctivo")
    mensaje_correctivo = relationship("MensajeCorrectivo", backref="mantenimiento")
    fotos = relationship("MantenimientoCorrectivoFoto", backref="mantenimiento")

class MantenimientoCorrectivoFoto(Base):
    __tablename__ = "mantenimiento_correctivo_foto"
    id = Column(Integer, primary_key=True)
    mantenimiento_id = Column(Integer, ForeignKey("mantenimiento_correctivo.id"))
    url = Column(String, nullable=False)

class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    email = Column(String, unique=True, nullable=False)
    rol = Column(String)
    firebase_uid = Column(String, unique=True, nullable=True)  # ID de Firebase

class CorrectivoSeleccionado(Base):
    __tablename__ = "correctivo_seleccionado"
    id = Column(Integer, primary_key=True)
    id_cuadrilla = Column(Integer, ForeignKey("cuadrilla.id"))
    id_mantenimiento = Column(Integer, ForeignKey("mantenimiento_correctivo.id"))
    id_sucursal = Column(Integer, ForeignKey("sucursal.id"))
    
    mantenimiento_correctivo = relationship("MantenimientoCorrectivo", back_populates="correctivo_seleccionado")
    cuadrilla = relationship("Cuadrilla", back_populates="correctivo_seleccionado")
    sucursal = relationship("Sucursal", back_populates="correctivo_seleccionado")
    
class PreventivoSeleccionado(Base):
    __tablename__ = "preventivo_seleccionado"
    id = Column(Integer, primary_key=True)
    id_cuadrilla = Column(Integer, ForeignKey("cuadrilla.id"))
    id_mantenimiento = Column(Integer, ForeignKey("mantenimiento_preventivo.id"))
    id_sucursal = Column(Integer, ForeignKey("sucursal.id"))
    
    mantenimiento_preventivo = relationship("MantenimientoPreventivo", back_populates="preventivo_seleccionado")
    cuadrilla = relationship("Cuadrilla", back_populates="preventivo_seleccionado")
    sucursal = relationship("Sucursal", back_populates="preventivo_seleccionado")

class PushSubscription(Base):
    __tablename__ = "push_subscription"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, nullable=False)
    endpoint = Column(String, nullable=False)
    p256dh = Column(String, nullable=False)
    auth = Column(String, nullable=False)
    device_info = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
class Notificacion_Correctivo(Base):
    __tablename__ = "notificacion_correctivo"

    id = Column(Integer, primary_key=True)
    firebase_uid = Column(String, nullable=False)
    id_mantenimiento = Column(Integer, ForeignKey("mantenimiento_correctivo.id"))
    mensaje = Column(String, nullable=False)
    leida = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")))
    
    mantenimiento_correctivo = relationship("MantenimientoCorrectivo", back_populates="notificacion_correctivo")

class Notificacion_Preventivo(Base):
    __tablename__ = "notificacion_preventivo"

    id = Column(Integer, primary_key=True)
    firebase_uid = Column(String, nullable=False)
    id_mantenimiento = Column(Integer, ForeignKey("mantenimiento_preventivo.id"))
    mensaje = Column(String, nullable=False)
    leida = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")))
    
    mantenimiento_preventivo = relationship("MantenimientoPreventivo", back_populates="notificacion_preventivo")
class MensajeCorrectivo(Base):
    __tablename__ = "mensaje_correctivo"
    id = Column(Integer, primary_key=True)
    firebase_uid = Column(String)
    nombre_usuario = Column(String)
    id_mantenimiento = Column(Integer, ForeignKey("mantenimiento_correctivo.id"))
    texto = Column(String, nullable=True)
    archivo = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")))
    
class MensajePreventivo(Base):
    __tablename__ = "mensaje_preventivo"
    id = Column(Integer, primary_key=True)
    firebase_uid = Column(String)
    nombre_usuario = Column(String)
    id_mantenimiento = Column(Integer, ForeignKey("mantenimiento_preventivo.id"))
    texto = Column(String, nullable=True)
    archivo = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")))

class ColumnPreference(Base):
    __tablename__ = "column_preference"

    id = Column(Integer, primary_key=True)
    firebase_uid = Column(String, nullable=False, index=True)
    page = Column(String, nullable=False)
    columns = Column(Text, nullable=False)
