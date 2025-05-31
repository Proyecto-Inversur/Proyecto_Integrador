from google.cloud import storage
from google.api_core.exceptions import GoogleAPIError
from fastapi import HTTPException, UploadFile
import uuid
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_folder_if_not_exists(bucket_name: str, folder_path: str):
    try:
        credentials_path = os.getenv("GOOGLE_CREDENTIALS")
        if not credentials_path or not os.path.exists(credentials_path):
            logger.error(f"GOOGLE_CREDENTIALS not set or file not found: {credentials_path}")
            raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
        
        storage_client = storage.Client.from_service_account_json(credentials_path)
        bucket = storage_client.bucket(bucket_name)
        if not folder_path.endswith('/'):
            folder_path += '/'
        blob = bucket.blob(folder_path)
        if not blob.exists():
            blob.upload_from_string('', content_type='application/x-directory')
    except GoogleAPIError as e:
        logger.error(f"Error creating folder in GCS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create folder in GCS: {str(e)}")

async def upload_file_to_gcloud(file: UploadFile, bucket_name: str, folder: str = "") -> str:
    try:
        credentials_path = os.getenv("GOOGLE_CREDENTIALS")
        if not credentials_path or not os.path.exists(credentials_path):
            logger.error(f"GOOGLE_CREDENTIALS not set or file not found: {credentials_path}")
            raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
        
        storage_client = storage.Client.from_service_account_json(credentials_path)
        bucket = storage_client.bucket(bucket_name)
        
        create_folder_if_not_exists(bucket_name, folder)
        
        file_extension = file.filename.split(".")[-1]
        destination_blob_name = f"{folder}/{uuid.uuid4()}.{file_extension}"
        
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_file(file.file, content_type=file.content_type)
        
        return blob.public_url
    except GoogleAPIError as e:
        logger.error(f"Error uploading file to GCS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file to GCS: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in upload_file_to_gcloud: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

def delete_file_in_folder(bucket_name: str, file_path: str) -> bool:
    try:
        credentials_path = os.getenv("GOOGLE_CREDENTIALS")
        if not credentials_path or not os.path.exists(credentials_path):
            logger.error(f"GOOGLE_CREDENTIALS not set or file not found: {credentials_path}")
            raise HTTPException(status_code=500, detail="Google Cloud credentials not configured")
        
        storage_client = storage.Client.from_service_account_json(credentials_path)
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_path)
        if blob.exists():
            blob.delete()
            return True
        return False
    except GoogleAPIError as e:
        logger.error(f"Error deleting file in GCS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file in GCS: {str(e)}")