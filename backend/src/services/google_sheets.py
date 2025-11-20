import os
import json
import logging
from datetime import date, datetime

import gspread
from gspread.exceptions import APIError
try:
    from gspread.exceptions import CellNotFound
except ImportError:
    class CellNotFound(Exception):
        """Fallback when gspread does not expose CellNotFound."""
        pass
from oauth2client.service_account import ServiceAccountCredentials
from google.cloud import storage

from api.models import MantenimientoCorrectivo, MantenimientoPreventivo

logger = logging.getLogger(__name__)

GOOGLE_CREDENTIALS = os.getenv("GOOGLE_CREDENTIALS")
GOOGLE_CLOUD_BUCKET_NAME = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")
SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
GOOGLE_CREDENTIALS_DICT = json.loads(GOOGLE_CREDENTIALS) if GOOGLE_CREDENTIALS else None
storage_client = (
    storage.Client.from_service_account_info(GOOGLE_CREDENTIALS_DICT)
    if GOOGLE_CREDENTIALS_DICT
    else None
)

TRACKING_COLUMN_NAME = "_mantenimiento_id"

CORRECTIVO_HEADER = [
    "cliente",
    "sucursal",
    "cuadrilla",
    "fecha_apertura",
    "fecha_cierre",
    "numero_caso",
    "incidente",
    "rubro",
    "planilla",
    "estado",
    "prioridad",
    "extendido",
    "fotos_gallery_url",
    TRACKING_COLUMN_NAME,
]
CORRECTIVO_VISIBLE_COLUMNS = len(CORRECTIVO_HEADER) - 1

PREVENTIVO_HEADER = [
    "cliente",
    "sucursal",
    "frecuencia",
    "cuadrilla",
    "fecha_apertura",
    "fecha_cierre",
    "extendido",
    "planillas_gallery_url",
    "fotos_gallery_url",
    TRACKING_COLUMN_NAME,
]
PREVENTIVO_VISIBLE_COLUMNS = len(PREVENTIVO_HEADER) - 1

def get_client():
    if not GOOGLE_CREDENTIALS_DICT:
        return None
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive",
    ]
    try:
        creds = ServiceAccountCredentials.from_json_keyfile_dict(GOOGLE_CREDENTIALS_DICT, scope)
        return gspread.authorize(creds)
    except Exception as exc:
        logger.warning("Failed to initialize Google Sheets client: %s", exc, exc_info=True)
        return None

def _blob_exists(path: str) -> bool:
    if not storage_client or not GOOGLE_CLOUD_BUCKET_NAME:
        return False
    bucket = storage_client.bucket(GOOGLE_CLOUD_BUCKET_NAME)
    return bucket.blob(path).exists()

def get_fotos_gallery_url(mantenimiento_id, tipo):
    blob_path = f"mantenimientos_{tipo}/{mantenimiento_id}/fotos/index.html"
    if not _blob_exists(blob_path):
        return None
    return f"https://storage.googleapis.com/{GOOGLE_CLOUD_BUCKET_NAME}/{blob_path}"

def get_planillas_gallery_url(mantenimiento_id):
    blob_path = f"mantenimientos_preventivos/{mantenimiento_id}/planillas/index.html"
    if not _blob_exists(blob_path):
        return None
    return f"https://storage.googleapis.com/{GOOGLE_CLOUD_BUCKET_NAME}/{blob_path}"

def _get_worksheet(sheet_name: str):
    if not SHEET_ID:
        return None
    client = get_client()
    if not client:
        return None
    return client.open_by_key(SHEET_ID).worksheet(sheet_name)

def _safe_sheet_operation(operation_name: str, callback):
    try:
        callback()
    except Exception as exc:
        logger.warning("Google Sheets %s failed: %s", operation_name, exc, exc_info=True)

def _column_letter(index: int) -> str:
    if index <= 0:
        return "A"
    result = ""
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result

def _apply_filters(worksheet, visible_columns: int):
    if visible_columns <= 0:
        return
    last_col_letter = _column_letter(visible_columns)
    last_row = worksheet.row_count or 1
    try:
        worksheet.set_basic_filter(f"A1:{last_col_letter}{max(last_row, 1)}")
    except APIError:
        pass
    except Exception:
        pass

def _append_row_with_filters(worksheet, row_values, visible_columns: int):
    worksheet.append_row(row_values)
    _apply_filters(worksheet, visible_columns)

def _hide_column(worksheet, column_index: int):
    if column_index <= 0:
        return
    if not hasattr(worksheet, "hide_columns"):
        return
    try:
        worksheet.hide_columns(column_index)
    except APIError:
        pass
    except Exception:
        pass

def _ensure_header(worksheet, header, visible_columns: int):
    if not worksheet.row_values(1):
        worksheet.append_row(header)
    _apply_filters(worksheet, visible_columns)
    _hide_column(worksheet, visible_columns + 1)

def _tracking_token(source) -> str:
    mantenimiento_id = source if isinstance(source, int) else getattr(source, "id", None)
    if mantenimiento_id is None:
        return ""
    return str(mantenimiento_id)

def _format_datetime_value(value):
    if value is None:
        return ""
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)

def _resolve_related_name(mantenimiento, attr: str) -> str:
    related = getattr(mantenimiento, attr, None)
    if related and getattr(related, "nombre", None):
        return related.nombre
    fallback = getattr(mantenimiento, f"{attr}_nombre", None)
    return fallback or ""

def _build_correctivo_row(mantenimiento: MantenimientoCorrectivo, include_links: bool = False):
    foto_url = ""
    if include_links:
        foto_url = get_fotos_gallery_url(mantenimiento.id, "correctivos") or ""
    return [
        _resolve_related_name(mantenimiento, "cliente"),
        _resolve_related_name(mantenimiento, "sucursal"),
        _resolve_related_name(mantenimiento, "cuadrilla"),
        _format_datetime_value(getattr(mantenimiento, "fecha_apertura", None)),
        _format_datetime_value(getattr(mantenimiento, "fecha_cierre", None)),
        getattr(mantenimiento, "numero_caso", "") or "",
        getattr(mantenimiento, "incidente", "") or "",
        getattr(mantenimiento, "rubro", "") or "",
        getattr(mantenimiento, "planilla", "") or "",
        getattr(mantenimiento, "estado", "") or "",
        getattr(mantenimiento, "prioridad", "") or "",
        _format_datetime_value(getattr(mantenimiento, "extendido", None)),
        foto_url,
        _tracking_token(mantenimiento),
    ]

def _build_preventivo_row(mantenimiento: MantenimientoPreventivo, include_links: bool = False):
    planillas_url = ""
    fotos_url = ""
    if include_links:
        planillas_url = get_planillas_gallery_url(mantenimiento.id) or ""
        fotos_url = get_fotos_gallery_url(mantenimiento.id, "preventivos") or ""
    return [
        _resolve_related_name(mantenimiento, "cliente"),
        _resolve_related_name(mantenimiento, "sucursal"),
        getattr(mantenimiento, "frecuencia", "") or "",
        _resolve_related_name(mantenimiento, "cuadrilla"),
        _format_datetime_value(getattr(mantenimiento, "fecha_apertura", None)),
        _format_datetime_value(getattr(mantenimiento, "fecha_cierre", None)),
        _format_datetime_value(getattr(mantenimiento, "extendido", None)),
        planillas_url,
        fotos_url,
        _tracking_token(mantenimiento),
    ]

def append_correctivo(mantenimiento: MantenimientoCorrectivo):
    def _operation():
        worksheet = _get_worksheet("MantenimientosCorrectivos")
        if not worksheet:
            return
        _ensure_header(worksheet, CORRECTIVO_HEADER, CORRECTIVO_VISIBLE_COLUMNS)
        _append_row_with_filters(
            worksheet,
            _build_correctivo_row(mantenimiento, include_links=False),
            CORRECTIVO_VISIBLE_COLUMNS,
        )
    _safe_sheet_operation("append_correctivo", _operation)

def update_correctivo(mantenimiento: MantenimientoCorrectivo):
    def _operation():
        worksheet = _get_worksheet("MantenimientosCorrectivos")
        if not worksheet:
            return
        _ensure_header(worksheet, CORRECTIVO_HEADER, CORRECTIVO_VISIBLE_COLUMNS)
        token = _tracking_token(mantenimiento)
        if not token:
            _append_row_with_filters(
                worksheet,
                _build_correctivo_row(mantenimiento, include_links=False),
                CORRECTIVO_VISIBLE_COLUMNS,
            )
            return
        try:
            cell = worksheet.find(token, in_column=len(CORRECTIVO_HEADER))
        except CellNotFound:
            _append_row_with_filters(
                worksheet,
                _build_correctivo_row(mantenimiento, include_links=False),
                CORRECTIVO_VISIBLE_COLUMNS,
            )
            return
        row = _build_correctivo_row(mantenimiento, include_links=True)
        end_col = _column_letter(len(CORRECTIVO_HEADER))
        worksheet.update(f"A{cell.row}:{end_col}{cell.row}", [row])
    _safe_sheet_operation("update_correctivo", _operation)

def delete_correctivo(mantenimiento_id: int):
    def _operation():
        worksheet = _get_worksheet("MantenimientosCorrectivos")
        if not worksheet:
            return
        _ensure_header(worksheet, CORRECTIVO_HEADER, CORRECTIVO_VISIBLE_COLUMNS)
        token = _tracking_token(mantenimiento_id)
        if not token:
            return
        try:
            cell = worksheet.find(token, in_column=len(CORRECTIVO_HEADER))
        except CellNotFound:
            return
        worksheet.delete_rows(cell.row)
    _safe_sheet_operation("delete_correctivo", _operation)

def append_preventivo(mantenimiento: MantenimientoPreventivo):
    def _operation():
        worksheet = _get_worksheet("MantenimientosPreventivos")
        if not worksheet:
            return
        _ensure_header(worksheet, PREVENTIVO_HEADER, PREVENTIVO_VISIBLE_COLUMNS)
        _append_row_with_filters(
            worksheet,
            _build_preventivo_row(mantenimiento, include_links=False),
            PREVENTIVO_VISIBLE_COLUMNS,
        )
    _safe_sheet_operation("append_preventivo", _operation)

def update_preventivo(mantenimiento: MantenimientoPreventivo):
    def _operation():
        worksheet = _get_worksheet("MantenimientosPreventivos")
        if not worksheet:
            return
        _ensure_header(worksheet, PREVENTIVO_HEADER, PREVENTIVO_VISIBLE_COLUMNS)
        token = _tracking_token(mantenimiento)
        if not token:
            _append_row_with_filters(
                worksheet,
                _build_preventivo_row(mantenimiento, include_links=False),
                PREVENTIVO_VISIBLE_COLUMNS,
            )
            return
        try:
            cell = worksheet.find(token, in_column=len(PREVENTIVO_HEADER))
        except CellNotFound:
            _append_row_with_filters(
                worksheet,
                _build_preventivo_row(mantenimiento, include_links=False),
                PREVENTIVO_VISIBLE_COLUMNS,
            )
            return
        row = _build_preventivo_row(mantenimiento, include_links=True)
        end_col = _column_letter(len(PREVENTIVO_HEADER))
        worksheet.update(f"A{cell.row}:{end_col}{cell.row}", [row])
    _safe_sheet_operation("update_preventivo", _operation)

def delete_preventivo(mantenimiento_id: int):
    def _operation():
        worksheet = _get_worksheet("MantenimientosPreventivos")
        if not worksheet:
            return
        _ensure_header(worksheet, PREVENTIVO_HEADER, PREVENTIVO_VISIBLE_COLUMNS)
        token = _tracking_token(mantenimiento_id)
        if not token:
            return
        try:
            cell = worksheet.find(token, in_column=len(PREVENTIVO_HEADER))
        except CellNotFound:
            return
        worksheet.delete_rows(cell.row)
    _safe_sheet_operation("delete_preventivo", _operation)
