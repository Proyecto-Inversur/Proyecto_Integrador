import importlib
import io
import asyncio
import pytest
from fastapi import UploadFile, HTTPException
from starlette.datastructures import Headers
from src.services import gcloud_storage

def test_create_folder(monkeypatch):
    monkeypatch.setenv("GOOGLE_CREDENTIALS", "{\"project_id\": \"test\"}")
    importlib.reload(gcloud_storage)

    class DummyBlob:
        def __init__(self):
            self.uploaded = False

        def exists(self):
            return False

        def upload_from_string(self, content, content_type=None):
            self.uploaded = True

    class DummyBucket:
        def __init__(self):
            self.blob_obj = DummyBlob()

        def blob(self, path):
            return self.blob_obj

    class DummyClient:
        def __init__(self):
            self.bucket_obj = DummyBucket()

        def bucket(self, name):
            return self.bucket_obj
    client = DummyClient()
    monkeypatch.setattr(gcloud_storage.storage.Client, "from_service_account_info", lambda info: client)

    gcloud_storage.create_folder_if_not_exists("bucket", "folder")

    assert client.bucket_obj.blob_obj.uploaded

def test_generate_gallery_html(monkeypatch):
    monkeypatch.setenv("GOOGLE_CREDENTIALS", "{\"project_id\": \"test\"}")
    importlib.reload(gcloud_storage)

    class DummyBlob:
        def __init__(self, name=None):
            self.name = name
            self.uploaded_content = None
            self.content_type = 'image/jpeg' if self.name.endswith('.jpg') else 'image/png' if self.name.endswith('.png') else None

        def upload_from_string(self, content, content_type=None):
            self.uploaded_content = content
            
        def exists(self):
            return False

        def delete(self):
            pass

        def patch(self):
            pass

    class DummyBucket:
        def __init__(self):
            self.created = {}

        def list_blobs(self, prefix):
            return [DummyBlob(f"{prefix}a.jpg"), DummyBlob(f"{prefix}b.png")]

        def blob(self, name):
            blob = self.created.get(name)
            if not blob:
                blob = DummyBlob(name)
                self.created[name] = blob
            return blob

    class DummyClient:
        def __init__(self):
            self.bucket_obj = DummyBucket()

        def bucket(self, name):
            return self.bucket_obj

    client = DummyClient()
    monkeypatch.setattr(gcloud_storage.storage.Client, "from_service_account_info", lambda info: client)

    url = gcloud_storage.generate_gallery_html("bucket", "photos")

    assert url == "https://storage.googleapis.com/bucket/photos/index.html"
    index_blob = client.bucket_obj.created["photos/index.html"]
    assert "<div class=\"gallery\">" in index_blob.uploaded_content

def test_upload_file_to_gcloud(monkeypatch):
    monkeypatch.setenv("GOOGLE_CREDENTIALS", "{\"project_id\": \"test\"}")
    importlib.reload(gcloud_storage)

    class DummyBlob:
        def __init__(self):
            self.uploaded = False
            self.upload_content_type = None
            self.public_url = "https://example.com/file.txt"

        def upload_from_file(self, file, content_type=None):
            self.uploaded = True
            self.upload_content_type = content_type
        
        def patch(self):
            pass

    class DummyBucket:
        def __init__(self):
            self.blob_obj = DummyBlob()

        def blob(self, path):
            return self.blob_obj

    class DummyClient:
        def __init__(self):
            self.bucket_obj = DummyBucket()

        def bucket(self, name):
            return self.bucket_obj

    client = DummyClient()
    monkeypatch.setattr(
        gcloud_storage.storage.Client,
        "from_service_account_info",
        lambda info: client,
    )
    monkeypatch.setattr(
        gcloud_storage, "create_folder_if_not_exists", lambda *args, **kwargs: None
    )
    monkeypatch.setattr(
        gcloud_storage, "generate_gallery_html", lambda *args, **kwargs: None
    )

    upload = UploadFile(filename="test.txt", file=io.BytesIO(b"data"))
    upload.headers = Headers({"content-type": "text/plain"})

    url = asyncio.run(gcloud_storage.upload_file_to_gcloud(upload, "bucket", "folder"))

    assert url == client.bucket_obj.blob_obj.public_url
    assert client.bucket_obj.blob_obj.uploaded
    assert client.bucket_obj.blob_obj.upload_content_type == "text/plain"

def test_delete_file_in_folder(monkeypatch):
    monkeypatch.setenv("GOOGLE_CREDENTIALS", "{\"project_id\": \"test\"}")
    importlib.reload(gcloud_storage)

    class DummyBlob:
        def __init__(self):
            self.deleted = False

        def exists(self):
            return True

        def delete(self):
            self.deleted = True

    class DummyBucket:
        def __init__(self, blob):
            self.blob_obj = blob
            self.last_path = None

        def blob(self, path):
            self.last_path = path
            return self.blob_obj

    class DummyClient:
        def __init__(self, bucket):
            self.bucket_obj = bucket

        def bucket(self, name):
            return self.bucket_obj

    dummy_blob = DummyBlob()
    bucket = DummyBucket(dummy_blob)
    client = DummyClient(bucket)
    monkeypatch.setattr(gcloud_storage.storage.Client, "from_service_account_info", lambda info: client)

    called = {}
    monkeypatch.setattr(gcloud_storage, "generate_gallery_html", lambda bn, fd: called.setdefault("gallery", (bn, fd)))

    result = gcloud_storage.delete_file_in_folder("bucket", "folder/", "/file.txt")

    assert result is True
    assert dummy_blob.deleted
    assert called["gallery"] == ("bucket", "folder/")
    assert bucket.last_path == "folder/file.txt"

def test_upload_chat_file_to_gcloud(monkeypatch):
    monkeypatch.setenv("GOOGLE_CREDENTIALS", "{\"project_id\": \"test\"}")
    importlib.reload(gcloud_storage)

    class DummyBlob:
        def __init__(self):
            self.uploaded = False
            self.upload_content_type = None
            self.public_url = "https://example.com/chat.txt"

        def upload_from_file(self, file, content_type=None):
            self.uploaded = True
            self.upload_content_type = content_type

    class DummyBucket:
        def __init__(self):
            self.blob_obj = DummyBlob()

        def blob(self, path):
            return self.blob_obj

    class DummyClient:
        def __init__(self):
            self.bucket_obj = DummyBucket()

        def bucket(self, name):
            return self.bucket_obj

    client = DummyClient()
    monkeypatch.setattr(
        gcloud_storage.storage.Client,
        "from_service_account_info",
        lambda info: client,
    )
    monkeypatch.setattr(
        gcloud_storage, "create_folder_if_not_exists", lambda *args, **kwargs: None
    )

    upload = UploadFile(filename="chat.txt", file=io.BytesIO(b"chat"))
    upload.headers = Headers({"content-type": "text/plain"})

    url = asyncio.run(
        gcloud_storage.upload_chat_file_to_gcloud(upload, "bucket", "folder")
    )

    assert url == client.bucket_obj.blob_obj.public_url
    assert client.bucket_obj.blob_obj.uploaded
    assert client.bucket_obj.blob_obj.upload_content_type == "text/plain"

def test_create_folder_missing_credentials(monkeypatch):
    monkeypatch.setattr(gcloud_storage, "GOOGLE_CREDENTIALS", None)
    with pytest.raises(HTTPException):
        gcloud_storage.create_folder_if_not_exists("bucket", "folder")

def test_generate_gallery_html_missing_credentials(monkeypatch):
    monkeypatch.setattr(gcloud_storage, "GOOGLE_CREDENTIALS", None)
    with pytest.raises(HTTPException):
        gcloud_storage.generate_gallery_html("bucket", "folder")

def test_upload_file_to_gcloud_missing_credentials(monkeypatch):
    monkeypatch.setattr(gcloud_storage, "GOOGLE_CREDENTIALS", None)
    upload = UploadFile(filename="t.txt", file=io.BytesIO(b"data"))
    upload.headers = Headers({"content-type": "text/plain"})
    with pytest.raises(HTTPException):
        asyncio.run(gcloud_storage.upload_file_to_gcloud(upload, "bucket", "folder"))

def test_upload_chat_file_to_gcloud_missing_credentials(monkeypatch):
    monkeypatch.setattr(gcloud_storage, "GOOGLE_CREDENTIALS", None)
    upload = UploadFile(filename="c.txt", file=io.BytesIO(b"chat"))
    upload.headers = Headers({"content-type": "text/plain"})
    with pytest.raises(HTTPException):
        asyncio.run(
            gcloud_storage.upload_chat_file_to_gcloud(upload, "bucket", "folder")
        )

def test_delete_file_in_folder_missing_credentials(monkeypatch):
    monkeypatch.setattr(gcloud_storage, "GOOGLE_CREDENTIALS", None)
    with pytest.raises(HTTPException):
        gcloud_storage.delete_file_in_folder("bucket", "folder", "/file")
