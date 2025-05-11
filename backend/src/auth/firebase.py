import firebase_admin
from firebase_admin import credentials, auth
import os
import json

def initialize_firebase():
    if not firebase_admin._apps:  # Verifica si la app ya está inicializada
        if os.getenv("FIREBASE_CREDENTIALS"):
            firebase_creds = json.loads(os.getenv("FIREBASE_CREDENTIALS"))
            cred = credentials.Certificate(firebase_creds)
        else:
            cred = credentials.Certificate("firebase-adminsdk.json")
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()

# Inicializar Firebase al importar el módulo
initialize_firebase()