import os
import re
import email.utils
import base64
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

options.set_global_options(region="southamerica-west1")
initialize_app()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "super-secret-key-for-flask")
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
app.config.update(SESSION_COOKIE_SECURE=True, SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='None', PERMANENT_SESSION_LIFETIME=timedelta(hours=8))

allowed_origins_str = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins_list = [origin.strip() for origin in allowed_origins_str.split(',')]
CORS(app, origins=allowed_origins_list, supports_credentials=True)

script_dir = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRETS_FILE = os.path.join(script_dir, 'client_secret.json')
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'openid']

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

def get_email_body(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                encoded_body = part['body'].get('data', '')
                return base64.urlsafe_b64decode(encoded_body).decode('utf-8')
            if 'parts' in part:
                body = get_email_body(part)
                if body: return body
    elif 'body' in payload:
        encoded_body = payload['body'].get('data', '')
        if encoded_body: return base64.urlsafe_b64decode(encoded_body).decode('utf-8')
    return ""

def fetch_thread_ids(service, query):
    thread_ids = set()
    try:
        results = service.users().messages().list(userId='me', q=query, maxResults=500).execute()
        messages = results.get('messages', [])
        if not messages: return set()
        for msg_info in messages:
            thread_ids.add(msg_info['threadId'])
    except HttpError as e:
        print(f"Error fetching thread IDs for query '{query}': {e}")
    return thread_ids

@app.route('/api/auth/google', methods=['POST', 'OPTIONS'])
def exchange_auth_code():
    if request.method == 'OPTIONS': return '', 204
    auth_code = request.json.get('code')
    if not auth_code: return jsonify({"error": "Authorization code not provided"}), 400
    flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri='postmessage')
    try:
        flow.fetch_token(code=auth_code)
        creds = flow.credentials
        session['credentials'] = {'token': creds.token, 'refresh_token': creds.refresh_token, 'token_uri': creds.token_uri, 'client_id': creds.client_id, 'client_secret': creds.client_secret, 'scopes': creds.scopes}
        session.permanent = True
        userinfo_service = build('oauth2', 'v2', credentials=creds)
        session['user_info'] = userinfo_service.userinfo().get().execute()
        return jsonify({"status": "success", "email": session['user_info'].get('email')})
    except Exception as e:
        return jsonify({"error": f"Failed to exchange authorization code: {e}"}), 500

@app.route('/api/emails', methods=['GET', 'OPTIONS'])
def get_emails():
    if request.method == 'OPTIONS': return '', 204
    if 'credentials' not in session: return jsonify({"error": "User not authenticated"}), 401

    try:
        credentials = Credentials(**session['credentials'])
        service = build('gmail', 'v1', credentials=credentials)
        
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        subject = request.args.get('subject')
        
        base_query_parts = []
        if subject: base_query_parts.append(f'subject:"{subject}"')
        
        start_date_filter = datetime.fromisoformat(start_date_str).astimezone() if start_date_str else None
        end_date_filter = (datetime.fromisoformat(end_date_str).astimezone() + timedelta(days=1)) if end_date_str else None

        if start_date_str: base_query_parts.append(f'after:{start_date_str}')
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            base_query_parts.append(f'before:{(end_date + timedelta(days=1)).strftime("%Y-%m-%d")}')

        received_query = ' '.join(base_query_parts + ['in:inbox', '-from:soporte@west-ingenieria.cl','-from:no-reply@west-ingenieria.cl', '-subject:"Delivery Status Notification"'])
        received_thread_ids = fetch_thread_ids(service, received_query)

        sent_query = ' '.join(base_query_parts + ['in:sent'])
        sent_thread_ids = fetch_thread_ids(service, sent_query)

        email_details = []
        raw_received_subjects = []

        for thread_id in received_thread_ids:
            thread_details = service.users().threads().get(userId='me', id=thread_id, format='full').execute()
            messages = thread_details['messages']
            
            # Ordenar mensajes para encontrar el original
            messages_with_dates = [{'id': m['id'], 'date': parse_date(get_header(m['payload']['headers'], 'Date')), 'subject': get_header(m['payload']['headers'], 'Subject'), 'payload': m['payload'], 'labelIds': m.get('labelIds', [])} for m in messages]
            messages_with_dates.sort(key=lambda x: x['date'] if x['date'] else datetime.min.astimezone())
            
            original_email_msg = messages_with_dates[0]
            raw_received_subjects.append(original_email_msg['subject'])

            if not original_email_msg['date'] or (start_date_filter and original_email_msg['date'] < start_date_filter) or (end_date_filter and original_email_msg['date'] >= end_date_filter):
                continue
            
            body_content = get_email_body(original_email_msg['payload'])
            
            is_answered = thread_id in sent_thread_ids
            response_time_str, first_reply_time = "N/A", None

            if is_answered:
                sent_messages = [m for m in messages_with_dates if 'SENT' in m['labelIds']]
                sent_messages.sort(key=lambda x: x['date'] if x['date'] else datetime.min.astimezone())
                
                first_reply = next((sent_msg for sent_msg in sent_messages if sent_msg['date'] > original_email_msg['date']), None)
                if first_reply:
                    first_reply_time = first_reply['date'].isoformat()
                    response_time = first_reply['date'] - original_email_msg['date']
                    if response_time.total_seconds() > 0:
                        d, s = response_time.days, response_time.seconds
                        response_time_str = f"{d}d {s//3600}h {(s%3600)//60}m"
                else:
                    is_answered = False 
            
            email_details.append({"thread_id": thread_id, "subject": original_email_msg['subject'], "body": body_content, "received_date": original_email_msg['date'].isoformat(), "is_answered": is_answered, "response_time_str": response_time_str, "first_reply_time": first_reply_time})
        
        return jsonify({"status": "success", "data": {"details": email_details, "raw_data": {"received_subjects": raw_received_subjects}}})

    except Exception as e:
        return jsonify({"error": f"Failed to fetch emails: {e}"}), 500

@https_fn.on_request()
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
