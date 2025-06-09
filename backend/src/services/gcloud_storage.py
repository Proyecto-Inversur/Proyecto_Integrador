from google.cloud import storage
from google.api_core.exceptions import GoogleAPIError
from fastapi import HTTPException, UploadFile
import uuid
import os

def create_folder_if_not_exists(bucket_name: str, folder_path: str):
    try:
        credentials_path = os.getenv("GOOGLE_CREDENTIALS")
        if not credentials_path or not os.path.exists(credentials_path):
            raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
        
        storage_client = storage.Client.from_service_account_json(credentials_path)
        bucket = storage_client.bucket(bucket_name)
        if not folder_path.endswith('/'):
            folder_path += '/'
        blob = bucket.blob(folder_path)
        if not blob.exists():
            blob.upload_from_string('', content_type='application/x-directory')
    except GoogleAPIError as e:
        raise HTTPException(status_code=500, detail=f"Failed to create folder in GCS: {str(e)}")

def generate_gallery_html(bucket_name: str, folder: str):
    """Generate an HTML gallery for photos in the specified GCS folder."""
    try:
        credentials_path = os.getenv("GOOGLE_CREDENTIALS")
        if not isinstance(credentials_path, str) or not os.path.exists(credentials_path):
            raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
        
        storage_client = storage.Client.from_service_account_json(credentials_path)
        bucket = storage_client.bucket(bucket_name)
        prefix = folder.rstrip("/") + "/"
        blobs = bucket.list_blobs(prefix=prefix)
        urls = [f"https://storage.googleapis.com/{bucket_name}/{blob.name}" for blob in blobs if not blob.name.endswith("index.html")]
        
        if not urls:
            return None  # No photos, no gallery needed
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .gallery {{ display: flex; flex-wrap: wrap; gap: 10px; }}
                .gallery img {{ max-width: 200px; height: auto; border: 1px solid #ddd; }}
            </style>
        </head>
        <body>
            <div class="gallery">
        """
        for url in urls:
            html_content += f'<a href="{url}" target="_blank"><img src="{url}" alt="Photo"></a>'
        html_content += """
            </div>
        </body>
        </html>
        """
        
        blob = bucket.blob(f"{prefix}index.html")
        blob.upload_from_string(html_content, content_type="text/html")
        return f"https://storage.googleapis.com/{bucket_name}/{prefix}index.html"
    except GoogleAPIError as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate gallery HTML: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

async def upload_file_to_gcloud(file: UploadFile, bucket_name: str, folder: str = "") -> str:
    try:
        credentials_path = os.getenv("GOOGLE_CREDENTIALS")
        if not credentials_path or not os.path.exists(credentials_path):
            raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
        
        storage_client = storage.Client.from_service_account_json(credentials_path)
        bucket = storage_client.bucket(bucket_name)
        
        create_folder_if_not_exists(bucket_name, folder)
        
        file_extension = file.filename.split(".")[-1]
        destination_blob_name = f"{folder.rstrip('/')}/{uuid.uuid4()}.{file_extension}"
        
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_file(file.file, content_type=file.content_type)
        
        generate_gallery_html(bucket_name, folder)
        
        return blob.public_url
    except GoogleAPIError as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file to GCS: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

def delete_file_in_folder(bucket_name: str, folder: str, file_path: str) -> bool:
    try:
        credentials_path = os.getenv("GOOGLE_CREDENTIALS")
        if not credentials_path or not os.path.exists(credentials_path):
            raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
        
        storage_client = storage.Client.from_service_account_json(credentials_path)
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(f"{folder.rstrip('/')}{file_path}")
        if blob.exists():
            blob.delete()
            generate_gallery_html(bucket_name, folder)
            return True
        return False
    except GoogleAPIError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file in GCS: {str(e)}")