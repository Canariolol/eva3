import os
import re
import email.utils
# MODIFICADO: Añadimos la opción de región
from firebase_functions import https_fn, options
from firebase_admin import initialize_app
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow, Flow
from googleapiclient.discovery import build
from flask import Flask, redirect, request, session, url_for, jsonify
from datetime import datetime, timedelta
from googleapiclient.errors import HttpError
from werkzeug.test import create_environ

# Especificamos la región para todas las funciones en este archivo
options.set_global_options(region="southamerica-west1")

# Initialize Firebase Admin SDK
initialize_app()

# --- INICIO DE LA APLICACIÓN FLASK ---
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "una-clave-secreta-muy-fuerte-y-aleatoria")
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

script_dir = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRETS_FILE = os.path.join(script_dir, 'client_secret.json')
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email', 'openid']

# --- Rutas de Autenticación ---
@app.route('/')
@app.route('/index')
def index():
    return """
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>Analizador de Correos de Gmail</h1>
            <p>Obtén un análisis de tu bandeja de entrada.</p>
            <a href="/login"><button style="font-size: 1.2em; padding: 10px 20px;">Iniciar sesión con Google</button></a>
        </body>
    """

@app.route('/login')
def login():
    # ADVERTENCIA: Esta URL cambiará después del despliegue
    redirect_uri = "https://gmail-api-handler-7r5ppdbuya-tl.a.run.app/callback"
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=redirect_uri)
    authorization_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')
    session['state'] = state
    return redirect(authorization_url)


@app.route('/callback')
def callback():
    state = request.args['state']
    # ADVERTENCIA: Esta URL cambiará después del despliegue
    redirect_uri = "https://gmail-api-handler-7r5ppdbuya-tl.a.run.app/callback"
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state, redirect_uri=redirect_uri)
    
    authorization_response = request.url.replace('http://', 'https://')
    flow.fetch_token(authorization_response=authorization_response)
    
    credentials = flow.credentials
    session['credentials'] = {'token': credentials.token, 'refresh_token': credentials.refresh_token, 'token_uri': credentials.token_uri, 'client_id': credentials.client_id, 'client_secret': credentials.client_secret, 'scopes': credentials.scopes}
    
    return redirect('/results')

# --- Funciones Auxiliares ---
def get_header_value(headers, name):
    for header in headers:
        if header['name'].lower() == name.lower():
            return header['value']
    return ''

def normalize_subject(subject):
    s = subject.lower()
    s = re.sub(r'^(re|fw|fwd|aw|rv|vs|enc|reenv|r)[\d\[\]]*:\s*', '', s).strip()
    s = re.sub(r'\s*\[\d+\]$', '', s).strip()
    s = re.sub(r'\s*\(\d+\)$', '', s).strip()
    return s

# --- Endpoint Principal de Datos ---
@app.route('/get-data')
def get_data():
    if 'credentials' not in session:
        return jsonify({'error': 'Usuario no autenticado'}), 401

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    SUBJECT_LIMIT = 50
    PROCESSING_LIMIT = 200

    date_query = ""
    if start_date_str:
        date_query += f" after:{start_date_str.replace('-', '/')}"
    
    if end_date_str:
        end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d')
        inclusive_end_date = end_date_obj + timedelta(days=1)
        end_date_query_str = inclusive_end_date.strftime('%Y/%m/%d')
        date_query += f" before:{end_date_query_str}"

    exclude_sender_query = " -from:correo@correo.com"

    credentials = Credentials(**session['credentials'])
    service = build('gmail', 'v1', credentials=credentials)

    try:
        profile = service.users().getProfile(userId='me').execute()
        user_email = profile.get('emailAddress')

        start_date_obj = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else None
        end_date_obj = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else None

        unique_incoming_subjects = {}
        inbox_threads_request = service.users().threads().list(userId='me', q=f"in:inbox{date_query}{exclude_sender_query}", maxResults=PROCESSING_LIMIT).execute()
        inbox_threads = inbox_threads_request.get('threads', [])

        for thread_info in inbox_threads:
            thread_details = service.users().threads().get(userId='me', id=thread_info['id']).execute()
            messages = thread_details.get('messages', [])
            if not messages: continue

            first_message = messages[0]
            date_str = get_header_value(first_message['payload']['headers'], 'Date')
            if not date_str: continue

            first_message_dt = email.utils.parsedate_to_datetime(date_str)
            first_message_date = first_message_dt.date()
            
            if start_date_obj and end_date_obj and (start_date_obj <= first_message_date <= end_date_obj):
                original_subject = get_header_value(first_message['payload']['headers'], 'Subject')
                normalized = normalize_subject(original_subject)
                if normalized not in unique_incoming_subjects:
                    unique_incoming_subjects[normalized] = original_subject

        unique_outgoing_subjects = {}
        outgoing_exclude_keywords = ["keywords here"]
        
        sent_threads_request = service.users().threads().list(userId='me', q=f"in:sent{date_query}", maxResults=PROCESSING_LIMIT).execute()
        sent_threads = sent_threads_request.get('threads', [])
        
        for thread_info in sent_threads:
            thread_details = service.users().threads().get(userId='me', id=thread_info['id']).execute()
            messages = thread_details.get('messages', [])
            if not messages: continue

            original_subject = get_header_value(messages[0]['payload']['headers'], 'Subject')
            normalized = normalize_subject(original_subject)
            
            if normalized.strip() in ['monitor', 'alarmas']: continue
            if any(keyword.lower() in normalized for keyword in outgoing_exclude_keywords): continue
            if normalized in unique_outgoing_subjects: continue

            if len(messages) > 1 or 'soporte@west-ingenieria.cl' not in get_header_value(messages[0]['payload']['headers'], 'To'):
                date_str = get_header_value(messages[0]['payload']['headers'], 'Date')
                if not date_str: continue
                message_dt = email.utils.parsedate_to_datetime(date_str)
                if start_date_obj and end_date_obj and (start_date_obj <= message_dt.date() <= end_date_obj):
                    unique_outgoing_subjects[normalized] = original_subject
        
        unanswered_emails = []
        query_unanswered = f"in:inbox and -in:sent{date_query}{exclude_sender_query}"
        request_unanswered = service.users().threads().list(userId='me', q=query_unanswered, maxResults=5).execute()
        threads_unanswered = request_unanswered.get('threads', [])
        for thread_info in threads_unanswered:
            thread_details = service.users().threads().get(userId='me', id=thread_info['id']).execute()
            first_message = thread_details['messages'][0]
            subject = get_header_value(first_message['payload']['headers'], 'Subject')
            snippet = first_message['snippet']
            unanswered_emails.append({'subject': subject, 'snippet': snippet})
        
        return jsonify({
            'user_email': user_email,
            'incoming_threads_count': len(unique_incoming_subjects),
            'outgoing_threads_count': len(unique_outgoing_subjects),
            'incoming_subjects': list(unique_incoming_subjects.values())[:SUBJECT_LIMIT],
            'outgoing_subjects': list(unique_outgoing_subjects.values())[:SUBJECT_LIMIT],
            'unanswered_emails': unanswered_emails
        })
    except HttpError as e:
        return jsonify({'error': f"Error de la API de Gmail: {e.reason}"}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Ruta de la Página de Resultados ---
@app.route('/results')
def results():
    return """
        <html>
            <head>
                <title>Resultados del Análisis</title>
                <style>
                    body { font-family: sans-serif; margin: 2em; background-color: #f4f7f6; }
                    .container { max-width: 800px; margin: auto; }
                    h1, h2 { color: #333; }
                    .card { background-color: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                    .unanswered-email { border-left: 4px solid #f44336; padding-left: 15px; margin-bottom: 15px; }
                    strong { color: #0056b3; }
                    em { color: #555; }
                    .filter-section { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; padding: 15px; background-color: #e9ecef; border-radius: 8px;}
                    .subject-list { list-style-type: disc; padding-left: 20px; font-size: 0.9em; max-height: 200px; overflow-y: auto; }
                    .email-display { text-align: right; color: #666; font-size: 0.9em; padding-bottom: 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-display" id="user-email-display"></div>
                    <h1>📊 Tu Análisis de Gmail</h1>
                    <div class="card filter-section">
                        <label for="start_date">Desde:</label>
                        <input type="date" id="start_date">
                        <label for="end_date">Hasta:</label>
                        <input type="date" id="end_date">
                        <button id="filter_button">Filtrar</button>
                    </div>
                    <div class="card">
                        <h2>Conteos Generales</h2>
                        <div id="counts-container"><p>Selecciona un rango de fechas y haz clic en Filtrar.</p></div>
                    </div>
                    <div class="card">
                        <h2>🚨 Correos Entrantes Sin Responder</h2>
                        <div id="unanswered-container"><p>Los resultados se mostrarán aquí.</p></div>
                    </div>
                    <div class="card">
                        <h2>Asuntos de Correos Recibidos (únicos)</h2>
                        <div id="incoming-subjects-container"><p>Los resultados se mostrarán aquí.</p></div>
                    </div>
                    <div class="card">
                        <h2>Asuntos de Correos Enviados (únicos y filtrados)</h2>
                        <div id="outgoing-subjects-container"><p>Los resultados se mostrarán aquí.</p></div>
                    </div>
                    <a href="/index">Volver al inicio</a>
                </div>
                <script>
                    document.getElementById('filter_button').addEventListener('click', () => {
                        const startDate = document.getElementById('start_date').value;
                        const endDate = document.getElementById('end_date').value;
                        if (!startDate || !endDate) {
                            alert('Por favor, selecciona una fecha de inicio y una de fin.');
                            return;
                        }
                        const container = document.querySelector('.container');
                        container.style.opacity = '0.5';
                        fetch(`/get-data?start_date=${startDate}&end_date=${endDate}`)
                            .then(response => response.json())
                            .then(data => {
                                container.style.opacity = '1';
                                if (data.error) {
                                    document.getElementById('counts-container').innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
                                    return;
                                }
                                document.getElementById('user-email-display').innerHTML = `Análisis para: <strong>${data.user_email}</strong>`;
                                document.getElementById('counts-container').innerHTML = `
                                    <p>Conversaciones entrantes (únicas): <strong>${data.incoming_threads_count}</strong></p>
                                    <p>Conversaciones salientes (únicas): <strong>${data.outgoing_threads_count}</strong></p>
                                `;
                                const renderList = (elemId, list) => {
                                    const elem = document.getElementById(elemId);
                                    if (list.length > 0) {
                                        elem.innerHTML = '<ul class="subject-list">' + list.map(s => `<li>${s.replace(/</g, "&lt;")}</li>`).join('') + '</ul>';
                                    } else {
                                        elem.innerHTML = '<p>No se encontraron correos.</p>';
                                    }
                                };
                                renderList('incoming-subjects-container', data.incoming_subjects);
                                renderList('outgoing-subjects-container', data.outgoing_subjects);
                                const unansweredElem = document.getElementById('unanswered-container');
                                if (data.unanswered_emails.length > 0) {
                                    unansweredElem.innerHTML = data.unanswered_emails.map(e => `<div class="unanswered-email"><p><strong>Asunto:</strong> ${e.subject.replace(/</g, "&lt;")}</p><p><em>${e.snippet.replace(/</g, "&lt;")}...</em></p></div>`).join('');
                                } else {
                                    unansweredElem.innerHTML = '<p>¡Felicidades! No tienes correos sin responder.</p>';
                                }
                            }).catch(err => {
                                container.style.opacity = '1';
                                document.getElementById('counts-container').innerHTML = '<p style="color: red;">Error de conexión.</p>';
                            });
                    });
                </script>
            </body>
        </html>
    """
# --- PUNTO DE ENTRADA DE FIREBASE CLOUD FUNCTION ---
@https_fn.on_request()
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    environ = create_environ(
        base_url=req.base_url,
        path=req.path,
        query_string=req.query_string.decode('utf-8') if req.query_string else '',
        method=req.method,
        headers=list(req.headers.items()),
        data=req.data,
    )
    status_str = None
    headers_list = None
    def start_response(status, headers, exc_info=None):
        nonlocal status_str, headers_list
        status_str = status
        headers_list = headers
    response_iterator = app(environ, start_response)
    response_data = b"".join(response_iterator)
    status_code = int(status_str.split(' ')[0])
    return https_fn.Response(
        response=response_data,
        status=status_code,
        headers=dict(headers_list),
    )
