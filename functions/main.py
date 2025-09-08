# Welcome to Cloud Functions for Firebase.
# ... (imports y código existente) ...
import os
import re
import email.utils
import base64
import json
from datetime import datetime, time, timedelta
from collections import defaultdict
import pytz

from flask import Flask, request, jsonify
from flask_cors import CORS

from firebase_admin import initialize_app, auth, firestore
from firebase_functions import https_fn, options, identity_fn

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

options.set_global_options(region="southamerica-west1")
initialize_app()
db = firestore.client()

# --- FUNCIÓN DE AUTENTICACIÓN (NUEVA) ---
@identity_fn.before_user_created()
def on_new_user_signup(event: identity_fn.AuthBlockingEvent) -> identity_fn.BeforeCreateResponse:
    company_ref = db.collection('companies').document()
    user_data = {
        'uid': event.data.uid, 'email': event.data.email, 'role': 'manager',
        'companyId': company_ref.id, 'createdAt': firestore.SERVER_TIMESTAMP
    }
    db.collection('users').document(event.data.uid).set(user_data)
    auth.set_custom_user_claims(event.data.uid, {
        'role': 'manager', 'companyId': company_ref.id
    })
    return identity_fn.BeforeCreateResponse()

# --- NUEVA FUNCIÓN TEMPORAL PARA ASIGNAR ROL DE SUPERADMIN ---
@https_fn.on_call(secrets=[])
def set_superadmin_claim(req: https_fn.CallableRequest) -> https_fn.Response:
    """
    Asigna el custom claim de 'superadmin' a un usuario existente.
    Debe ser invocada por un administrador desde un entorno seguro.
    Toma el email del usuario como argumento.
    """
    email = req.data.get("email")
    if not email:
        raise https_fn.HttpsError(code="invalid-argument", message="El email es requerido.")

    try:
        # Busca al usuario por su email para obtener su UID
        user = auth.get_user_by_email(email)
        
        # Asigna el custom claim 'superadmin'
        auth.set_custom_user_claims(user.uid, {'role': 'superadmin'})
        
        # Opcional: También actualiza el rol en el documento de Firestore del usuario
        user_ref = db.collection('users').document(user.uid)
        if user_ref.get().exists:
            user_ref.update({'role': 'superadmin'})
        else:
            user_ref.set({'role': 'supepiuradmin', 'email': email}, merge=True)
            
        return https_fn.Response(f"El rol 'superadmin' fue asignado exitosamente a {email}.")
    except Exception as e:
        raise https_fn.HttpsError(code="internal", message=f"Ocurrió un error: {str(e)}")


# --- API DE GMAIL (CÓDIGO EXISTENTE) ---
app = Flask(__name__)
# ... (todo el código de /api/emails y /api/verify_reply va aquí sin cambios) ...

@https_fn.on_request()
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
