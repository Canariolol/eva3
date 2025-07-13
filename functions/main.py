import os
import re
import email.utils
from firebase_functions import https_fn, options
from firebase_admin import initialize_app
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask import Flask, request, session, jsonify
from flask_cors import CORS # Importar CORS
from datetime import datetime, timedelta
from googleapiclient.errors import HttpError

# Especificamos la región para todas las funciones en este archivo
options.set_global_options(region="southamerica-west1")

# Initialize Firebase Admin SDK
initialize_app()

# --- INICIO DE LA APLICACIÓN FLASK ---
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "una-clave-secreta-muy-fuerte-y-aleatoria")
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# --- Configuración de CORS Dinámica ---
# Lee una cadena de URLs separadas por comas desde las variables de entorno.
# Si no se define, por defecto solo permite localhost para desarrollo.
allowed_origins_str = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins_list = [origin.strip() for origin in allowed_origins_str.split(',')]

# Habilita CORS con la lista dinámica de orígenes.
CORS(app, origins=allowed_origins_list, supports_credentials=True)

script_dir = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRETS_FILE = os.path.join(script_dir, 'client_secret.json')
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email', 'openid']

# --- Rutas de API ---

@app.route('/api/auth/google', methods=['POST', 'OPTIONS'])
def exchange_auth_code():
    if request.method == 'OPTIONS':
        return '', 204
    auth_code = request.json.get('code')
    if not auth_code:
        return jsonify({"error": "Authorization code not provided"}), 400
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri='postmessage')
    try:
        flow.fetch_token(code=auth_code)
        credentials = flow.credentials
        session['credentials'] = {
            'token': credentials.token, 'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri, 'client_id': credentials.client_id,
            'client_secret': credentials.client_secret, 'scopes': credentials.scopes
        }
        userinfo_service = build('oauth2', 'v2', credentials=credentials)
        user_info = userinfo_service.userinfo().get().execute()
        session['user_info'] = user_info
        return jsonify({"status": "success", "email": user_info.get('email')})
    except Exception as e:
        print(f"Error exchanging auth code: {e}")
        return jsonify({"error": "Failed to exchange authorization code"}), 500

@app.route('/api/emails', methods=['GET', 'OPTIONS'])
def get_emails():
    if request.method == 'OPTIONS':
        return '', 204
    if 'credentials' not in session:
        return jsonify({"error": "User not authenticated"}), 401
    try:
        credentials = Credentials(**session['credentials'])
        service = build('gmail', 'v1', credentials=credentials)
        results = service.users().messages().list(userId='me', labelIds=['INBOX'], maxResults=10).execute()
        messages = results.get('messages', [])
        return jsonify({"status": "success", "data": messages})
    except HttpError as error:
        print(f"An API error occurred: {error}")
        return jsonify({"error": "An API error occurred.", "details": str(error)}), 500
    except Exception as e:
        print(f"Error fetching emails: {e}")
        return jsonify({"error": "Failed to fetch emails."}), 500

# --- Enrutador de Firebase Functions ---
@https_fn.on_request()
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
