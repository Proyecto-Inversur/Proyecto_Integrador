from unittest.mock import Mock
from datetime import date
from src.services import google_sheets
from src.api.models import MantenimientoCorrectivo, MantenimientoPreventivo

def _mock_client_with_worksheet(worksheet):
    spreadsheet = Mock()
    spreadsheet.worksheet.return_value = worksheet
    client = Mock()
    client.open_by_key.return_value = spreadsheet
    return client

def _sample_correctivo():
    return MantenimientoCorrectivo(
        id=1,
        id_sucursal=1,
        id_cuadrilla=2,
        fecha_apertura=date(2024, 1, 1),
        fecha_cierre=None,
        numero_caso="NC",
        incidente="Inc",
        rubro="Rubro",
        planilla=None,
        estado="open",
        prioridad="alta",
        extendido=None,
    )

def _sample_preventivo():
    return MantenimientoPreventivo(
        id=1,
        id_sucursal=1,
        frecuencia="mensual",
        id_cuadrilla=2,
        fecha_apertura=date(2024, 1, 1),
        fecha_cierre=None,
        extendido=None,
    )

def test_get_fotos_gallery_url(monkeypatch):
    monkeypatch.setattr(google_sheets, '_blob_exists', lambda p: True)
    monkeypatch.setattr(google_sheets, 'GOOGLE_CLOUD_BUCKET_NAME', 'test-bucket')
    expected = (
        "https://storage.googleapis.com/test-bucket/"
        "mantenimientos_correctivos/1/fotos/index.html"
    )
    assert google_sheets.get_fotos_gallery_url(1, "correctivos") == expected

def test_get_planillas_gallery_url(monkeypatch):
    monkeypatch.setattr(google_sheets, '_blob_exists', lambda p: True)
    monkeypatch.setattr(google_sheets, 'GOOGLE_CLOUD_BUCKET_NAME', 'test-bucket')
    expected = (
        "https://storage.googleapis.com/test-bucket/"
        "mantenimientos_preventivos/1/planillas/index.html"
    )
    assert google_sheets.get_planillas_gallery_url(1) == expected

def test_append_correctivo(monkeypatch):
    worksheet = Mock()
    worksheet.row_values.return_value = ["id"]
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.append_correctivo(_sample_correctivo())

    worksheet.append_row.assert_called_once_with(
        [
            1,
            1,
            2,
            "2024-01-01",
            "",
            "NC",
            "Inc",
            "Rubro",
            "",
            "open",
            "alta",
            "",
        ]
    )

def test_update_correctivo(monkeypatch):
    worksheet = Mock()
    cell = Mock()
    cell.row = 2
    worksheet.find.return_value = cell
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    mantenimiento = _sample_correctivo()
    google_sheets.update_correctivo(mantenimiento)

    worksheet.update.assert_called_once_with(
        "A2:M2",
        [[1, 1, 2, "2024-01-01", "", "NC", "Inc", "Rubro", "", "open", "alta", "", ""]],
    )

def test_delete_correctivo(monkeypatch):
    worksheet = Mock()
    cell = Mock()
    cell.row = 2
    worksheet.find.return_value = cell
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.delete_correctivo(1)

    worksheet.delete_rows.assert_called_once_with(2)

def test_append_preventivo(monkeypatch):
    worksheet = Mock()
    worksheet.row_values.return_value = ["id"]
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.append_preventivo(_sample_preventivo())

    worksheet.append_row.assert_called_once_with(
        [1, 1, "mensual", 2, "2024-01-01", "", ""]
    )

def test_update_preventivo(monkeypatch):
    worksheet = Mock()
    cell = Mock()
    cell.row = 2
    worksheet.find.return_value = cell
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.update_preventivo(_sample_preventivo())

    worksheet.update.assert_called_once_with(
        "A2:I2",
        [[1, 1, "mensual", 2, "2024-01-01", "", "", "", ""]],
    )

def test_delete_preventivo(monkeypatch):
    worksheet = Mock()
    cell = Mock()
    cell.row = 2
    worksheet.find.return_value = cell
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.delete_preventivo(1)

    worksheet.delete_rows.assert_called_once_with(2)

def test_append_correctivo_adds_header(monkeypatch):
    worksheet = Mock()
    worksheet.row_values.return_value = []
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.append_correctivo(_sample_correctivo())

    assert worksheet.append_row.call_count == 2

def test_update_correctivo_not_found(monkeypatch):
    worksheet = Mock()
    worksheet.find.return_value = None
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")
    append_mock = Mock()
    monkeypatch.setattr(google_sheets, "append_correctivo", append_mock)

    google_sheets.update_correctivo(_sample_correctivo())

    append_mock.assert_called_once()

def test_delete_correctivo_not_found(monkeypatch):
    worksheet = Mock()
    worksheet.find.return_value = None
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.delete_correctivo(1)

    worksheet.delete_rows.assert_not_called()

def test_append_preventivo_adds_header(monkeypatch):
    worksheet = Mock()
    worksheet.row_values.return_value = []
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.append_preventivo(_sample_preventivo())

    assert worksheet.append_row.call_count == 2

def test_update_preventivo_not_found(monkeypatch):
    worksheet = Mock()
    worksheet.find.return_value = None
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")
    append_mock = Mock()
    monkeypatch.setattr(google_sheets, "append_preventivo", append_mock)

    google_sheets.update_preventivo(_sample_preventivo())

    append_mock.assert_called_once()

def test_delete_preventivo_not_found(monkeypatch):
    worksheet = Mock()
    worksheet.find.return_value = None
    monkeypatch.setattr(
        google_sheets, "get_client", lambda: _mock_client_with_worksheet(worksheet)
    )
    monkeypatch.setattr(google_sheets, "SHEET_ID", "sheet")

    google_sheets.delete_preventivo(1)

    worksheet.delete_rows.assert_not_called()
