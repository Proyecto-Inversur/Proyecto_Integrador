from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Zona(Base):
    __tablename__ = "zona"
    id = Column(Integer, primary_key=True)
    nombre = Column(String, unique=True, nullable=False)

class Sucursal(Base):
    __tablename__ = "sucursal"
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    zona = Column(String)
    direccion = Column(String)
    superficie = Column(String)
    
    preventivos = relationship("Preventivo", back_populates="sucursal")
    mantenimientos_preventivos = relationship("MantenimientoPreventivo", back_populates="sucursal")
    mantenimientos_correctivos = relationship("MantenimientoCorrectivo", back_populates="sucursal")

class Cuadrilla(Base):
    __tablename__ = "cuadrilla"
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    zona = Column(String)
    email = Column(String, unique=True, nullable=False)
    firebase_uid = Column(String, unique=True, nullable=True)  # ID de Firebase
    
    mantenimientos_preventivos = relationship("MantenimientoPreventivo", back_populates="cuadrilla")
    mantenimientos_correctivos = relationship("MantenimientoCorrectivo", back_populates="cuadrilla")

class Preventivo(Base):
    __tablename__ = "preventivo"
    id = Column(Integer, primary_key=True)
    id_sucursal = Column(Integer, ForeignKey("sucursal.id"))
    nombre_sucursal = Column(String)
    frecuencia = Column(String)
    
    sucursal = relationship("Sucursal", back_populates="preventivos")

class MantenimientoPreventivo(Base):
    __tablename__ = "mantenimiento_preventivo"
    id = Column(Integer, primary_key=True)
    id_sucursal = Column(Integer, ForeignKey("sucursal.id"))
    frecuencia = Column(String)
    id_cuadrilla = Column(Integer, ForeignKey("cuadrilla.id"))
    fecha_apertura = Column(Date)
    fecha_cierre = Column(Date)
    extendido = Column(DateTime, nullable=True)

    sucursal = relationship("Sucursal", back_populates="mantenimientos_preventivos")
    cuadrilla = relationship("Cuadrilla", back_populates="mantenimientos_preventivos")
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
    id_sucursal = Column(Integer, ForeignKey("sucursal.id"))
    id_cuadrilla = Column(Integer, ForeignKey("cuadrilla.id"))
    fecha_apertura = Column(Date)
    fecha_cierre = Column(Date)
    numero_caso = Column(String)
    incidente = Column(String)
    rubro = Column(String)
    planilla = Column(String)
    estado = Column(String)
    prioridad = Column(String)
    extendido = Column(DateTime, nullable=True)
    
    sucursal = relationship("Sucursal", back_populates="mantenimientos_correctivos")
    cuadrilla = relationship("Cuadrilla", back_populates="mantenimientos_correctivos")
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
    
    reportes = relationship("Reporte", back_populates="usuario")

class Reporte(Base):
    __tablename__ = "reporte"
    id = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id"))
    tipo = Column(String)
    contenido = Column(Text)
    fecha = Column(Date)

    usuario = relationship("Usuario", back_populates="reportes")