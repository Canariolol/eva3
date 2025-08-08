
import os
import re
import email.utils
import base64
from firebase_functions import https_fn, options
from firebase_admin import initialize_app
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, time, timedelta
from googleapiclient.errors import HttpError
from collections import defaultdict
import pytz
import json

options.set_global_options(region="southamerica-west1")
initialize_app()

app = Flask(__name__)
CORS(app, origins=os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(','), supports_credentials=True, expose_headers=["Authorization"], allow_headers=["Authorization", "Content-Type"])

script_dir = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRETS_FILE = os.path.join(script_dir, 'client_secret.json')
with open(CLIENT_SECRETS_FILE) as f:
    CLIENT_ID = json.load(f)['web']['client_id']

IGNORED_SENDERS = ["soporte@west-ingenieria.cl"]
IGNORED_SUBJECT_KEYWORDS = ["out of office", "respuesta automática", "auto-reply", "undeliverable", "delivery status notification"]
CHILE_TZ = pytz.timezone('America/Santiago')

def parse_date(date_string):
    if not date_string:
        return None
    try:
        dt = email.utils.parsedate_to_datetime(date_string)
        if dt.tzinfo is None:
            return CHILE_TZ.localize(dt)
        else:
            return dt.astimezone(CHILE_TZ)
    except (TypeError, ValueError):
        try:
            dt_iso = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            return dt_iso.astimezone(CHILE_TZ)
        except ValueError:
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
                return base64.urlsafe_b64decode(encoded_body).decode('utf-8', 'ignore')
            if 'parts' in part:
                body = get_email_body(part)
                if body: return body
    elif 'body' in payload:
        encoded_body = payload['body'].get('data', '')
        if encoded_body: return base64.urlsafe_b64decode(encoded_body).decode('utf-8', 'ignore')
    return ""

def fetch_thread_ids(service, query):
    thread_ids = set()
    page_token = None
    try:
        while True:
            results = service.users().messages().list(userId='me', q=query, maxResults=500, pageToken=page_token).execute()
            messages = results.get('messages', [])
            if not messages: break
            for msg_info in messages:
                thread_ids.add(msg_info['threadId'])
            page_token = results.get('nextPageToken')
            if not page_token: break
    except HttpError as e:
        print(f"Error fetching thread IDs for query '{query}': {e}")
    return thread_ids


def get_credentials_from_request(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    credentials = Credentials(token=token, client_id=CLIENT_ID)
    return credentials

@app.route('/api/emails', methods=['GET', 'OPTIONS'])
def get_emails():
    if request.method == 'OPTIONS': return '', 204
    
    try:
        credentials = get_credentials_from_request(request)
        if not credentials:
            return jsonify({"error": "Authorization token missing or invalid"}), 401
        
        service = build('gmail', 'v1', credentials=credentials)
        
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        start_date_dt = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date_dt = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
        
        start_date_q = start_date_dt.strftime('%Y/%m/%d')
        end_date_q = end_date_dt.strftime('%Y/%m/%d')
        
        # --- CONSULTA FINAL CORREGIDA ---
        # Ahora busca en el INBOX y excluye los correos internos.
        final_query = f"after:{start_date_q} before:{end_date_q} -in:sent -from:west-ingenieria.cl in:inbox"

        threads_to_process = fetch_thread_ids(service, final_query)

        email_details = []
        
        start_date_dt_aware = CHILE_TZ.localize(start_date_dt)
        end_date_dt_aware = CHILE_TZ.localize(datetime.combine(end_date_dt.date() - timedelta(days=1), time(23, 59, 59)))

        for thread_id in threads_to_process:
            try:
                thread_details = service.users().threads().get(userId='me', id=thread_id, format='full').execute()
                messages = thread_details['messages']
                
                messages_with_dates = []
                for m in messages:
                    msg_date = parse_date(get_header(m['payload']['headers'], 'Date'))
                    if msg_date:
                        messages_with_dates.append({'id': m['id'], 'date': msg_date, 'from': get_header(m['payload']['headers'], 'From'), 'subject': get_header(m['payload']['headers'], 'Subject'), 'payload': m['payload'], 'labelIds': m.get('labelIds', [])})
                
                if not messages_with_dates: continue
                messages_with_dates.sort(key=lambda x: x['date'])
                
                original_email_msg = messages_with_dates[0]

                if not (start_date_dt_aware <= original_email_msg['date'] <= end_date_dt_aware):
                    continue
                
                if any(keyword in original_email_msg['subject'].lower() for keyword in IGNORED_SUBJECT_KEYWORDS):
                    continue
                
                sender_email = email.utils.parseaddr(original_email_msg['from'])[1]
                if sender_email in IGNORED_SENDERS:
                    continue
                
                sent_messages_in_thread = [m for m in messages_with_dates if 'SENT' in m['labelIds']]
                is_answered = len(sent_messages_in_thread) > 0
                response_time_str, first_reply_time = "N/A", None

                if is_answered:
                    first_reply = next((sent_msg for sent_msg in sent_messages_in_thread if sent_msg['date'] > original_email_msg['date']), None)
                    if first_reply:
                        first_reply_time = first_reply['date'].isoformat()
                        response_time = first_reply['date'] - original_email_msg['date']
                        if response_time.total_seconds() > 0:
                            d, s = response_time.days, response_time.seconds
                            response_time_str = f"{d}d {s//3600}h {(s%3600)//60}m"
                    else:
                        is_answered = False 
                
                body_content = get_email_body(original_email_msg['payload'])
                email_details.append({"thread_id": thread_id, "subject": original_email_msg['subject'], "from": original_email_msg['from'], "body": body_content, "received_date": original_email_msg['date'].isoformat(), "is_answered": is_answered, "response_time_str": response_time_str, "first_reply_time": first_reply_time, "is_duplicate": False})
            except HttpError as e: print(f"Skipping thread {thread_id} due to API error: {e}")

        subject_sender_map = defaultdict(list)
        for detail in email_details:
            sender_address = email.utils.parseaddr(detail['from'])[1]
            subject_sender_map[(detail['subject'], sender_address)].append(detail['thread_id'])
        for (subject, sender), thread_ids in subject_sender_map.items():
            if len(thread_ids) > 1:
                for detail in email_details:
                    if detail['thread_id'] in thread_ids: detail['is_duplicate'] = True
        
        debug_data = {
            "final_query_sent_to_gmail": final_query,
            "total_threads_found_by_query": len(threads_to_process),
            "final_emails_returned_to_frontend": len(email_details)
        }
        
        return jsonify({"status": "success", "data": {"details": email_details, "debug_data": debug_data}})
    except HttpError as e:
        if e.resp.status == 401: return jsonify({"error": "Authorization token has expired or been revoked."}), 401
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
    except Exception as e: return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@app.route('/api/verify_reply', methods=['POST'])
def verify_reply():
    if request.method == 'OPTIONS': return '', 204
    try:
        credentials = get_credentials_from_request(request)
        if not credentials: return jsonify({"error": "Authorization token missing or invalid"}), 401
        service = build('gmail', 'v1', credentials=credentials)
        data = request.get_json()
        original_sender, subject, end_date_str = data.get('sender'), data.get('subject'), data.get('endDate')
        if not all([original_sender, subject, end_date_str]): return jsonify({"error": "Missing params"}), 400
        end_date_dt = CHILE_TZ.localize(datetime.strptime(end_date_str, '%Y-%m-%d'))
        extended_end_date = end_date_dt + timedelta(days=2)
        sender_email = email.utils.parseaddr(original_sender)[1]
        query = f'in:sent to:"{sender_email}" subject:"{subject}" before:{int(extended_end_date.timestamp())}'
        results = service.users().messages().list(userId='me', q=query, maxResults=1).execute()
        if results.get('messages'):
            msg_id = results['messages'][0]['id']
            message = service.users().messages().get(userId='me', id=msg_id).execute()
            reply_date = parse_date(get_header(message['payload']['headers'], 'Date'))
            return jsonify({"found": True, "reply_date": reply_date.isoformat() if reply_date else None})
        else:
            return jsonify({"found": False})
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

@https_fn.on_request()
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
