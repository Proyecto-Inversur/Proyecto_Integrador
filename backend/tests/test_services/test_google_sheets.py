from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock

from src.api.models import MantenimientoCorrectivo, MantenimientoPreventivo
from src.services import google_sheets
from src.services.google_sheets import CellNotFound


def _correctivo():
    m = MantenimientoCorrectivo(
        cliente_id=1,
        sucursal_id=1,
        id_cuadrilla=1,
        fecha_apertura=date(2024, 1, 1),
        numero_caso="NC",
        incidente="Incidente",
        rubro="Rubro",
        estado="Pendiente",
        prioridad="Alta",
    )
    m.id = 1
    m.cliente_nombre = "Cliente"
    m.sucursal_nombre = "Sucursal"
    m.cuadrilla_nombre = "Cuadrilla"
    return m


def _preventivo():
    m = MantenimientoPreventivo(
        cliente_id=1,
        sucursal_id=1,
        frecuencia="Mensual",
        id_cuadrilla=1,
        fecha_apertura=date(2024, 1, 1),
        estado="Pendiente",
    )
    m.id = 1
    m.cliente_nombre = "Cliente"
    m.sucursal_nombre = "Sucursal"
    m.cuadrilla_nombre = "Cuadrilla"
    return m


def test_get_fotos_gallery_url_returns_none_when_blob_missing(monkeypatch):
    monkeypatch.setattr(google_sheets, "_blob_exists", lambda _: False)
    assert google_sheets.get_fotos_gallery_url(1, "correctivos") is None


def test_get_planillas_gallery_url(monkeypatch):
    monkeypatch.setattr(google_sheets, "_blob_exists", lambda _: True)
    monkeypatch.setattr(google_sheets, "GOOGLE_CLOUD_BUCKET_NAME", "test-bucket")
    url = google_sheets.get_planillas_gallery_url(1)
    assert url.endswith("mantenimientos_preventivos/1/planillas/index.html")


def test_column_letter_conversion():
    assert google_sheets._column_letter(1) == "A"
    assert google_sheets._column_letter(27) == "AA"


def test_apply_filters_sets_range(monkeypatch):
    worksheet = MagicMock(row_count=10)
    google_sheets._apply_filters(worksheet, 5)
    worksheet.set_basic_filter.assert_called_once_with("A1:E10")


def test_build_correctivo_row_includes_links(monkeypatch):
    monkeypatch.setattr(google_sheets, "get_fotos_gallery_url", lambda *args, **kwargs: "https://files/fotos.html")
    row = google_sheets._build_correctivo_row(_correctivo(), include_links=True)
    assert row[-2] == "https://files/fotos.html"
    assert row[-1] == "1"


def test_build_preventivo_row_includes_links(monkeypatch):
    monkeypatch.setattr(google_sheets, "get_planillas_gallery_url", lambda *args, **kwargs: "https://files/planillas.html")
    monkeypatch.setattr(google_sheets, "get_fotos_gallery_url", lambda *args, **kwargs: "https://files/fotos.html")
    row = google_sheets._build_preventivo_row(_preventivo(), include_links=True)
    assert row[-3] == "https://files/planillas.html"
    assert row[-2] == "https://files/fotos.html"


def test_append_correctivo_ensures_header(monkeypatch):
    worksheet = MagicMock()
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    ensure = MagicMock()
    append = MagicMock()
    monkeypatch.setattr(google_sheets, "_ensure_header", ensure)
    monkeypatch.setattr(google_sheets, "_append_row_with_filters", append)

    google_sheets.append_correctivo(_correctivo())

    ensure.assert_called_once_with(worksheet, google_sheets.CORRECTIVO_HEADER, google_sheets.CORRECTIVO_VISIBLE_COLUMNS)
    append.assert_called_once()


def test_append_correctivo_skips_without_sheet(monkeypatch):
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: None)
    append = MagicMock()
    monkeypatch.setattr(google_sheets, "_append_row_with_filters", append)
    google_sheets.append_correctivo(_correctivo())
    append.assert_not_called()


def test_update_correctivo_updates_row(monkeypatch):
    worksheet = MagicMock()
    worksheet.find.return_value = SimpleNamespace(row=3)
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    monkeypatch.setattr(google_sheets, "_ensure_header", MagicMock())

    google_sheets.update_correctivo(_correctivo())

    worksheet.update.assert_called_once()
    args, _ = worksheet.update.call_args
    assert args[0] == "A3:N3"


def test_update_correctivo_appends_when_not_found(monkeypatch):
    worksheet = MagicMock()
    worksheet.find.side_effect = CellNotFound("missing")
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    append = MagicMock()
    monkeypatch.setattr(google_sheets, "_append_row_with_filters", append)
    monkeypatch.setattr(google_sheets, "_ensure_header", MagicMock())

    google_sheets.update_correctivo(_correctivo())

    append.assert_called_once()


def test_delete_correctivo(monkeypatch):
    worksheet = MagicMock()
    worksheet.find.return_value = SimpleNamespace(row=4)
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    monkeypatch.setattr(google_sheets, "_ensure_header", MagicMock())

    google_sheets.delete_correctivo(10)

    worksheet.delete_rows.assert_called_once_with(4)


def test_delete_correctivo_ignores_missing(monkeypatch):
    worksheet = MagicMock()
    worksheet.find.side_effect = CellNotFound("missing")
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    monkeypatch.setattr(google_sheets, "_ensure_header", MagicMock())

    google_sheets.delete_correctivo(10)

    worksheet.delete_rows.assert_not_called()


def test_append_preventivo(monkeypatch):
    worksheet = MagicMock()
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    ensure = MagicMock()
    append = MagicMock()
    monkeypatch.setattr(google_sheets, "_ensure_header", ensure)
    monkeypatch.setattr(google_sheets, "_append_row_with_filters", append)

    google_sheets.append_preventivo(_preventivo())

    ensure.assert_called_once_with(worksheet, google_sheets.PREVENTIVO_HEADER, google_sheets.PREVENTIVO_VISIBLE_COLUMNS)
    append.assert_called_once()


def test_update_preventivo_updates_existing_row(monkeypatch):
    worksheet = MagicMock()
    worksheet.find.return_value = SimpleNamespace(row=2)
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    monkeypatch.setattr(google_sheets, "_ensure_header", MagicMock())

    google_sheets.update_preventivo(_preventivo())

    worksheet.update.assert_called_once()
    args, _ = worksheet.update.call_args
    assert args[0] == "A2:J2"


def test_update_preventivo_appends_when_missing(monkeypatch):
    worksheet = MagicMock()
    worksheet.find.side_effect = CellNotFound("missing")
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    append = MagicMock()
    monkeypatch.setattr(google_sheets, "_ensure_header", MagicMock())
    monkeypatch.setattr(google_sheets, "_append_row_with_filters", append)

    google_sheets.update_preventivo(_preventivo())

    append.assert_called_once()


def test_delete_preventivo(monkeypatch):
    worksheet = MagicMock()
    worksheet.find.return_value = SimpleNamespace(row=5)
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    monkeypatch.setattr(google_sheets, "_ensure_header", MagicMock())

    google_sheets.delete_preventivo(5)

    worksheet.delete_rows.assert_called_once_with(5)


def test_delete_preventivo_not_found(monkeypatch):
    worksheet = MagicMock()
    worksheet.find.side_effect = CellNotFound("missing")
    monkeypatch.setattr(google_sheets, "_get_worksheet", lambda _: worksheet)
    monkeypatch.setattr(google_sheets, "_ensure_header", MagicMock())

    google_sheets.delete_preventivo(5)

    worksheet.delete_rows.assert_not_called()
