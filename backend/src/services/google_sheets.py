import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from sqlalchemy.orm import Session
from api.models import MantenimientoCorrectivo, MantenimientoPreventivo

GOOGLE_CREDENTIALS = os.getenv("GOOGLE_CREDENTIALS")
GOOGLE_CLOUD_BUCKET_NAME = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")
SHEET_ID = os.getenv("GOOGLE_SHEET_ID")

def get_client():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(GOOGLE_CREDENTIALS, scope)
    return gspread.authorize(creds)

def get_fotos_gallery_url(mantenimiento_id, tipo):
    return f"https://storage.googleapis.com/{GOOGLE_CLOUD_BUCKET_NAME}/mantenimientos_{tipo}/{mantenimiento_id}/fotos/index.html"

def get_planillas_gallery_url(mantenimiento_id):
    return f"https://storage.googleapis.com/{GOOGLE_CLOUD_BUCKET_NAME}/mantenimientos_preventivos/{mantenimiento_id}/planillas/index.html"

def append_correctivo(db: Session, mantenimiento: MantenimientoCorrectivo):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosCorrectivos")
    
    # Ensure header exists
    if not worksheet.row_values(1):
        worksheet.append_row([
            "id", "id_sucursal", "id_cuadrilla", "fecha_apertura", "fecha_cierre",
            "numero_caso", "incidente", "rubro", "planilla", "estado", "prioridad",
            "extendido", "fotos_gallery_url"
        ])
    
    row = [
        mantenimiento.id,
        mantenimiento.id_sucursal,
        mantenimiento.id_cuadrilla,
        str(mantenimiento.fecha_apertura),
        str(mantenimiento.fecha_cierre) if mantenimiento.fecha_cierre else "",
        mantenimiento.numero_caso,
        mantenimiento.incidente,
        mantenimiento.rubro,
        mantenimiento.planilla or "",
        mantenimiento.estado,
        mantenimiento.prioridad,
        str(mantenimiento.extendido) if mantenimiento.extendido else "",
        get_fotos_gallery_url(mantenimiento.id, "correctivos")
    ]
    worksheet.append_row(row)

def update_correctivo(db: Session, mantenimiento: MantenimientoCorrectivo):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosCorrectivos")
    
    # Find row by id
    cell = worksheet.find(str(mantenimiento.id), in_column=1)
    if not cell:
        return append_correctivo(db, mantenimiento)  # If not found, append as new
    
    row = [
        mantenimiento.id,
        mantenimiento.id_sucursal,
        mantenimiento.id_cuadrilla,
        str(mantenimiento.fecha_apertura),
        str(mantenimiento.fecha_cierre) if mantenimiento.fecha_cierre else "",
        mantenimiento.numero_caso,
        mantenimiento.incidente,
        mantenimiento.rubro,
        mantenimiento.planilla or "",
        mantenimiento.estado,
        mantenimiento.prioridad,
        str(mantenimiento.extendido) if mantenimiento.extendido else "",
        get_fotos_gallery_url(mantenimiento.id, "correctivos")
    ]
    worksheet.update(f"A{cell.row}:M{cell.row}", [row])

def delete_correctivo(db: Session, mantenimiento_id: int):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosCorrectivos")
    
    # Find row by id
    cell = worksheet.find(str(mantenimiento_id), in_column=1)
    if cell:
        worksheet.delete_rows(cell.row)

def append_preventivo(db: Session, mantenimiento: MantenimientoPreventivo):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosPreventivos")
    
    # Ensure header exists
    if not worksheet.row_values(1):
        worksheet.append_row([
            "id", "id_sucursal", "frecuencia", "id_cuadrilla", "fecha_apertura",
            "fecha_cierre", "extendido", "planillas_gallery_url", "fotos_gallery_url"
        ])
    
    row = [
        mantenimiento.id,
        mantenimiento.id_sucursal,
        mantenimiento.frecuencia,
        mantenimiento.id_cuadrilla,
        str(mantenimiento.fecha_apertura),
        str(mantenimiento.fecha_cierre) if mantenimiento.fecha_cierre else "",
        str(mantenimiento.extendido) if mantenimiento.extendido else "",
        get_planillas_gallery_url(mantenimiento.id),
        get_fotos_gallery_url(mantenimiento.id, "preventivos")
    ]
    worksheet.append_row(row)

def update_preventivo(db: Session, mantenimiento: MantenimientoPreventivo):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosPreventivos")
    
    # Find row by id
    cell = worksheet.find(str(mantenimiento.id), in_column=1)
    if not cell:
        return append_preventivo(db, mantenimiento)  # If not found, append as new
    
    row = [
        mantenimiento.id,
        mantenimiento.id_sucursal,
        mantenimiento.frecuencia,
        mantenimiento.id_cuadrilla,
        str(mantenimiento.fecha_apertura),
        str(mantenimiento.fecha_cierre) if mantenimiento.fecha_cierre else "",
        str(mantenimiento.extendido) if mantenimiento.extendido else "",
        get_planillas_gallery_url(mantenimiento.id),
        get_fotos_gallery_url(mantenimiento.id, "preventivos")
    ]
    worksheet.update(f"A{cell.row}:I{cell.row}", [row])

def delete_preventivo(db: Session, mantenimiento_id: int):
    client = get_client()
    worksheet = client.open_by_key(SHEET_ID).worksheet("MantenimientosPreventivos")
    
    # Find row by id
    cell = worksheet.find(str(mantenimiento_id), in_column=1)
    if cell:
        worksheet.delete_rows(cell.row)