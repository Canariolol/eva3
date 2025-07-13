import os
import re
import email.utils
from firebase_functions import https_fn, options
from firebase_admin import initialize_app
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask import Flask, request, session, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from googleapiclient.errors import HttpError
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError

# Configuración global
options.set_global_options(region="southamerica-west1")
initialize_app()

# --- Aplicación Flask ---
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "super-secret-key-for-flask")
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='None',
)

# Configuración de CORS dinámica
allowed_origins_str = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins_list = [origin.strip() for origin in allowed_origins_str.split(',')]
CORS(app, origins=allowed_origins_list, supports_credentials=True)

# Constantes de Google
script_dir = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRETS_FILE = os.path.join(script_dir, 'client_secret.json')
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly', 
    'https://www.googleapis.com/auth/userinfo.email', 
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
]

def parse_date(date_string):
    try:
        return email.utils.parsedate_to_datetime(date_string)
    except Exception:
        return None

def get_header(headers, name):
    for header in headers:
        if header['name'].lower() == name.lower():
            return header['value']
    return None

@app.route('/api/auth/google', methods=['POST', 'OPTIONS'])
def exchange_auth_code():
    if request.method == 'OPTIONS': return '', 204
    auth_code = request.json.get('code')
    if not auth_code:
        return jsonify({"error": "Authorization code not provided"}), 400
    
    flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri='postmessage')
    
    try:
        flow.fetch_token(code=auth_code)
        creds = flow.credentials
        session['credentials'] = {
            'token': creds.token, 'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri, 'client_id': creds.client_id,
            'client_secret': creds.client_secret, 'scopes': creds.scopes
        }
        userinfo_service = build('oauth2', 'v2', credentials=creds)
        user_info = userinfo_service.userinfo().get().execute()
        session['user_info'] = user_info
        return jsonify({"status": "success", "email": user_info.get('email')})
    except InvalidGrantError as e:
        print(f"!!! ERROR DE AUTENTICACIÓN DETALLADO (InvalidGrantError): {e}")
        return jsonify({"error": "Código de autorización inválido o expirado.", "details": str(e)}), 500
    except Exception as e:
        print(f"!!! ERROR GENÉRICO EN AUTH: {e}")
        return jsonify({"error": "Failed to exchange authorization code", "details": str(e)}), 500

@app.route('/api/emails', methods=['GET', 'OPTIONS'])
def get_emails():
    if request.method == 'OPTIONS': return '', 204
    if 'credentials' not in session:
        return jsonify({"error": "User not authenticated"}), 401

    try:
        credentials = Credentials(**session['credentials'])
        service = build('gmail', 'v1', credentials=credentials)
        
        # --- INICIO DE LA NUEVA LÓGICA ---
        # 1. Obtener parámetros de la URL
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        subject = request.args.get('subject')
        
        # 2. Construir la consulta de búsqueda dinámica
        query_parts = []
        if subject:
            query_parts.append(f'subject:"{subject}"')
        if start_date_str:
            query_parts.append(f'after:{start_date_str}')
        if end_date_str:
            # La API de Gmail es exclusiva para 'before', así que usamos el día siguiente.
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            next_day = end_date + timedelta(days=1)
            query_parts.append(f'before:{next_day.strftime("%Y-%m-%d")}')

        # Añadir el filtro para excluir al remitente
        query_parts.append('-from:soporte@west-ingenieria.cl')
        
        query = ' '.join(query_parts)
        # --- FIN DE LA NUEVA LÓGICA ---

        # Usamos la nueva query y aumentamos los resultados
        results = service.users().messages().list(userId='me', q=query, maxResults=500).execute()
        messages = results.get('messages', [])

        if not messages:
            return jsonify({
                "status": "success",
                "data": {
                    "total_emails": 0, "answered_emails": 0,
                    "average_response_time": "N/A", "details": []
                }
            })

        threads = {}
        for message_info in messages:
            msg = service.users().messages().get(userId='me', id=message_info['id'], format='metadata').execute()
            thread_id = msg['threadId']
            if thread_id not in threads:
                threads[thread_id] = []
            
            headers = msg['payload']['headers']
            message_data = {
                'id': msg['id'],
                'date': parse_date(get_header(headers, 'Date')),
                'from': get_header(headers, 'From'),
                'subject': get_header(headers, 'Subject'),
                'is_reply': 'Re:' in get_header(headers, 'Subject') or get_header(headers, 'In-Reply-To') is not None
            }
            threads[thread_id].append(message_data)

        answered_count = 0
        total_response_time = timedelta(0)
        email_details = []

        for thread_id, thread_messages in threads.items():
            thread_messages.sort(key=lambda x: x['date'] if x['date'] else datetime.min)
            original_email = thread_messages[0]
            
            # Buscamos una respuesta que NO sea del remitente excluido
            reply = next((m for m in thread_messages[1:] if 'soporte@west-ingenieria.cl' in m['from']), None)

            detail = {
                "thread_id": thread_id, "subject": original_email['subject'],
                "received_date": original_email['date'].isoformat() if original_email['date'] else 'N/A',
                "is_answered": False, "response_time_str": "N/A"
            }

            if reply and original_email['date'] and reply['date']:
                answered_count += 1
                response_time = reply['date'] - original_email['date']
                total_response_time += response_time
                detail["is_answered"] = True
                days, seconds = response_time.days, response_time.seconds
                hours = seconds // 3600
                minutes = (seconds % 3600) // 60
                detail["response_time_str"] = f"{days}d {hours}h {minutes}m"
            
            email_details.append(detail)
        
        avg_response_time_str = "N/A"
        if answered_count > 0:
            avg_time = total_response_time / answered_count
            days, seconds = avg_time.days, avg_time.seconds
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            avg_response_time_str = f"{days}d {hours}h {minutes}m"

        final_data = {
            "total_emails": len(threads),
            "answered_emails": answered_count,
            "average_response_time": avg_response_time_str,
            "details": email_details
        }
        return jsonify({"status": "success", "data": final_data})
    except HttpError as error:
        print(f"An API error occurred: {error}")
        return jsonify({"error": "An API error occurred.", "details": str(error)}), 500
    except Exception as e:
        print(f"Error fetching emails: {e}")
        return jsonify({"error": "Failed to fetch emails."}), 500

@https_fn.on_request()
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
