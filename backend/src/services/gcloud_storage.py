from google.cloud import storage
from fastapi import UploadFile
import uuid

def create_folder_if_not_exists(bucket_name: str, folder_path: str):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    # Ensure folder path ends with a slash
    if not folder_path.endswith('/'):
        folder_path += '/'
    # Create an empty object to represent the folder
    blob = bucket.blob(folder_path)
    # Upload an empty file to create the folder
    if not blob.exists():
        blob.upload_from_string('', content_type='application/x-directory')

async def upload_file_to_gcloud(file: UploadFile, bucket_name: str, folder: str = "") -> str:
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    
    # Create folder if it doesn't exist
    create_folder_if_not_exists(bucket_name, folder)
    
    # Generate a unique filename
    file_extension = file.filename.split(".")[-1]
    destination_blob_name = f"{folder}/{uuid.uuid4()}.{file_extension}"
    
    # Upload the file
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_file(file.file, content_type=file.content_type)
    
    # Make the file publicly accessible
    blob.make_public()
    
    return blob.public_url

async def upload_files_to_gcloud(files: list[UploadFile], bucket_name: str, folder: str = "") -> str:
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    
    # Ensure folder exists
    create_folder_if_not_exists(bucket_name, folder)
    
    # Upload each file
    for file in files:
        file_extension = file.filename.split(".")[-1]
        destination_blob_name = f"{folder}/{uuid.uuid4()}.{file_extension}"
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_file(file.file, content_type=file.content_type)
        blob.make_public()
    
    # Return the folder's public URL
    folder_path = folder if folder.endswith('/') else f"{folder}/"
    return f"https://storage.googleapis.com/{bucket_name}/{folder_path}"