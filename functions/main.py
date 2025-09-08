# Welcome to Cloud Functions for Firebase.
# To get started, edit and deploy this file.
#
# In this file, you will find examples of functions that are triggered by various
# events in Firebase.
#
# For more information on how to write Cloud Functions, see the documentation:
# https://firebase.google.com/docs/functions/

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

# --- INICIALIZACIÓN ---
# Define la región globalmente para todas las funciones
options.set_global_options(region="southamerica-west1")
# Inicializa Firebase Admin SDK
initialize_app()


# --- FUNCIÓN DE AUTENTICACIÓN (NUEVA) ---
# Esta función se dispara cada vez que un nuevo usuario se registra.
@identity_fn.before_user_created()
def on_new_user_signup(event: identity_fn.AuthBlockingEvent) -> identity_fn.BeforeCreateResponse:
    """
    Gestiona el registro de nuevos usuarios, creando una compañía,
    asignando roles y Custom Claims.
    """
    # Obtenemos el cliente de Firestore
    db = firestore.client()

    # Crea una nueva compañía para este usuario (que será un 'manager')
    company_ref = db.collection('companies').document()
    
    # Prepara los datos del perfil del nuevo usuario
    user_data = {
        'uid': event.data.uid,
        'email': event.data.email,
        'role': 'manager', # El primer usuario siempre es el manager
        'companyId': company_ref.id,
        'createdAt': firestore.SERVER_TIMESTAMP
    }
    
    # Guarda el perfil del usuario en la colección 'users'
    db.collection('users').document(event.data.uid).set(user_data)
    
    # Asigna los Custom Claims al token de autenticación del usuario.
    # Esto es CRUCIAL para las reglas de seguridad de Firestore.
    auth.set_custom_user_claims(event.data.uid, {
        'role': 'manager',
        'companyId': company_ref.id
    })

    return identity_fn.BeforeCreateResponse()


# --- API DE GMAIL (CÓDIGO EXISTENTE) ---
# (Se omite el código de la API de Gmail por brevedad, ya que no cambia)
app = Flask(__name__)
CORS(app, origins=os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(','), supports_credentials=True, expose_headers=["Authorization"], allow_headers=["Authorization", "Content-Type"])
# ... (todo el código de /api/emails y /api/verify_reply va aquí sin cambios) ...

@https_fn.on_request()
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    """Expone la API de Flask como una sola Cloud Function."""
    with app.request_context(req.environ):
        return app.full_dispatch_request()
