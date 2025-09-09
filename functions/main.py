# Welcome to Cloud Functions for Firebase.
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
options.set_global_options(region="southamerica-west1")
initialize_app()
db = firestore.client()
CHILE_TZ = pytz.timezone('America/Santiago')

# --- FUNCIÓN DE AUTENTICACIÓN (CÓDIGO EXISTENTE) ---
@identity_fn.before_user_created()
def on_new_user_signup(event: identity_fn.AuthBlockingEvent) -> identity_fn.BeforeCreateResponse:
    try:
        company_ref = db.collection('companies').document()
        user_data = {
            'uid': event.data.uid, 'email': event.data.email, 'role': 'manager',
            'companyId': company_ref.id, 'createdAt': firestore.SERVER_TIMESTAMP
        }
        db.collection('users').document(event.data.uid).set(user_data)
        
        header_info_ref = company_ref.collection('headerInfo').document('main')
        header_info_ref.set({
            'company': event.data.display_name or event.data.email,
            'manager': event.data.display_name or '',
            'area': 'General'
        })
        
        auth.set_custom_user_claims(event.data.uid, {
            'role': 'manager', 'companyId': company_ref.id
        })
    except Exception as e:
        print(f"Error en on_new_user_signup: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="No se pudo inicializar la cuenta."
        )
    return identity_fn.BeforeCreateResponse()

# --- FUNCIÓN DE ASIGNACIÓN DE ROL DE SUPERADMIN (CÓDIGO EXISTENTE) ---
@https_fn.on_call(secrets=[])
def set_superadmin_claim(req: https_fn.CallableRequest):
    email = req.data.get("email")
    if not email:
        raise https_fn.HttpsError(code="invalid-argument", message="El email es requerido.")
    try:
        user = auth.get_user_by_email(email)
        auth.set_custom_user_claims(user.uid, {'role': 'superadmin'})
        user_ref = db.collection('users').document(user.uid)
        user_ref.set({'role': 'superadmin', 'email': email}, merge=True)
        return {"message": f"Rol 'superadmin' asignado a {email}."}
    except Exception as e:
        raise https_fn.HttpsError(code="internal", message=str(e))

# --- API DE GMAIL (NUEVA LÓGICA REFACTORIZADA) ---
app = Flask(__name__)
CORS(app)

# --- Funciones de Ayuda para Gmail ---
def get_credentials_from_request(req):
    auth_header = req.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '): return None
    token = auth_header.split(' ')[1]
    CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "") # Es importante configurar esta variable de entorno
    return Credentials(token=token, client_id=CLIENT_ID)

def parse_date(date_string):
    if not date_string: return None
    try:
        dt = email.utils.parsedate_to_datetime(date_string)
        return dt.astimezone(CHILE_TZ) if dt.tzinfo else CHILE_TZ.localize(dt)
    except (TypeError, ValueError): return None

def get_header(headers, name):
    return next((h['value'] for h in headers if h['name'].lower() == name.lower()), None)

def get_email_body(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                encoded_body = part['body'].get('data', '')
                return base64.urlsafe_b64decode(encoded_body).decode('utf-8', 'ignore')
    elif 'body' in payload:
        encoded_body = payload['body'].get('data', '')
        if encoded_body: return base64.urlsafe_b64decode(encoded_body).decode('utf-8', 'ignore')
    return ""

def fetch_thread_ids(service, query):
    thread_ids = set()
    page_token = None
    while True:
        results = service.users().messages().list(userId='me', q=query, maxResults=500, pageToken=page_token).execute()
        messages = results.get('messages', [])
        if not messages: break
        for msg_info in messages:
            thread_ids.add(msg_info['threadId'])
        page_token = results.get('nextPageToken')
        if not page_token: break
    return list(thread_ids)

@app.route('/api/emails', methods=['GET'])
def get_emails_route():
    try:
        credentials = get_credentials_from_request(request)
        if not credentials:
            return jsonify({"error": "Authorization token missing"}), 401
        
        service = build('gmail', 'v1', credentials=credentials)
        
        filter_id = request.args.get('filterId')
        query_parts = []
        
        if filter_id == 'hardcoded_west':
            start_date = (datetime.now() - timedelta(days=7)).strftime('%Y/%m/%d')
            end_date = (datetime.now() + timedelta(days=1)).strftime('%Y/%m/%d')
            query_parts.extend([f"after:{start_date}", f"before:{end_date}", "-in:sent", "-from:west-ingenieria.cl", "in:inbox"])
        else:
            if from_email := request.args.get('from'): query_parts.append(f"from:({from_email})")
            if to_email := request.args.get('to'): query_parts.append(f"to:({to_email})")
            if subject := request.args.get('subject'): query_parts.append(f"subject:({subject})")
            # Añade aquí más filtros dinámicos si los necesitas

        final_query = " ".join(query_parts)
        if not final_query.strip():
            return jsonify({"error": "No filters provided"}), 400

        thread_ids = fetch_thread_ids(service, final_query)
        email_details = []
        
        for thread_id in thread_ids[:30]: # Limitar a 30 para evitar timeouts largos
             try:
                thread = service.users().threads().get(userId='me', id=thread_id).execute()
                first_message = thread['messages'][0]
                payload = first_message['payload']
                headers = payload['headers']
                
                detail = {
                    "thread_id": thread_id,
                    "subject": get_header(headers, 'Subject'),
                    "from": get_header(headers, 'From'),
                    "date": parse_date(get_header(headers, 'Date')).isoformat(),
                    "snippet": first_message.get('snippet', ''),
                    "body": get_email_body(payload)
                }
                email_details.append(detail)
             except HttpError as e:
                print(f"Skipping thread {thread_id} due to error: {e}")
        
        return jsonify({"status": "success", "data": {"query": final_query, "count": len(email_details), "details": email_details}})

    except Exception as e:
        print(f"Error in get_emails_route: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# --- FUNCIÓN PRINCIPAL QUE EXPONE LA API ---
@https_fn.on_request(region="southamerica-west1")
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
