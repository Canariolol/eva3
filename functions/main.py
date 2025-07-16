
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
from datetime import datetime, time, timedelta
from googleapiclient.errors import HttpError
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError
from collections import defaultdict
import pytz

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

INTERNAL_DOMAINS = ["@west-ingenieria.cl"]
IGNORED_SUBJECT_KEYWORDS = ["out of office", "respuesta automática", "auto-reply", "undeliverable", "delivery status notification"]

def parse_date(date_string):
    try:
        dt = email.utils.parsedate_to_datetime(date_string)
        return dt
    except (TypeError, ValueError):
        try:
            return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        except ValueError:
            return None

def get_header(headers, name):
    for header in headers:
        if header['name'].lower() == name.lower():
            return header['value']
    return None

def get_email_body(payload):
    # This function remains unchanged
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
    # This function remains unchanged
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

def fetch_raw_list(service, query):
    # This function remains unchanged
    messages_list = []
    page_token = None
    try:
        while True:
            results = service.users().messages().list(userId='me', q=query, maxResults=100, pageToken=page_token).execute()
            messages = results.get('messages', [])
            if not messages: break
            
            batch = service.new_batch_http_request(callback=lambda id, resp, exc: messages_list.append(resp) if not exc else None)
            for msg in messages:
                batch.add(service.users().messages().get(userId='me', id=msg['id'], format='metadata', metadataHeaders=['Subject', 'From', 'To', 'Date']))
            batch.execute()

            page_token = results.get('nextPageToken')
            if not page_token: break
    except HttpError as e:
        print(f"Error fetching raw list for query '{query}': {e}")
    
    processed_list = []
    for msg in messages_list:
        if msg and 'payload' in msg and 'headers' in msg['payload']:
             processed_list.append({
                'id': msg.get('id'),
                'threadId': msg.get('threadId'),
                'subject': get_header(msg['payload']['headers'], 'Subject'),
                'from': get_header(msg['payload']['headers'], 'From'),
                'to': get_header(msg['payload']['headers'], 'To'),
                'date': get_header(msg['payload']['headers'], 'Date'),
            })
    return processed_list

@app.route('/api/auth/google', methods=['POST', 'OPTIONS'])
def exchange_auth_code():
    # This function remains unchanged
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
        
        # --- Timezone-Aware Date Filtering ---
        chile_tz = pytz.timezone('America/Santiago')
        
        start_date_dt = chile_tz.localize(datetime.strptime(start_date_str, '%Y-%m-%d'))
        end_date_dt = chile_tz.localize(datetime.combine(datetime.strptime(end_date_str, '%Y-%m-%d').date(), time(23, 59, 59)))
        
        start_timestamp = int(start_date_dt.timestamp())
        end_timestamp = int(end_date_dt.timestamp())

        query_date_parts = [f'after:{start_timestamp}', f'before:{end_timestamp}']
        # --- End of Timezone-Aware Filtering ---

        base_query_parts = []
        if subject: base_query_parts.append(f'subject:"{subject}"')
        
        final_query_parts = base_query_parts + query_date_parts

        received_query = ' '.join(final_query_parts + ['in:inbox'])
        received_thread_ids = fetch_thread_ids(service, received_query)
        
        sent_query_all_time = ' '.join(base_query_parts + ['in:sent'])
        sent_thread_ids_all_time = fetch_thread_ids(service, sent_query_all_time)

        email_details = []

        for thread_id in received_thread_ids:
            try:
                thread_details = service.users().threads().get(userId='me', id=thread_id, format='full').execute()
                messages = thread_details['messages']
                
                messages_with_dates = [{'id': m['id'], 'date': parse_date(get_header(m['payload']['headers'], 'Date')), 'from': get_header(m['payload']['headers'], 'From'), 'subject': get_header(m['payload']['headers'], 'Subject'), 'payload': m['payload'], 'labelIds': m.get('labelIds', [])} for m in messages]
                messages_with_dates.sort(key=lambda x: x['date'] if x['date'] else datetime.min.astimezone())
                
                original_email_msg = messages_with_dates[0]
                
                sender_email = email.utils.parseaddr(original_email_msg['from'])[1]
                if any(domain in sender_email for domain in INTERNAL_DOMAINS): continue
                if any(keyword in original_email_msg['subject'].lower() for keyword in IGNORED_SUBJECT_KEYWORDS): continue
                
                body_content = get_email_body(original_email_msg['payload'])
                is_answered = thread_id in sent_thread_ids_all_time
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
                    else: is_answered = False 
                
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

        late_replies_data = {
            'incorrect_first_reply': 0,
            'correct_continued_reply': 0,
            'incorrect_details': [],
            'correct_details': []
        }
        
        sent_in_period_query = ' '.join(final_query_parts + ['in:sent'])
        sent_in_period_thread_ids = fetch_thread_ids(service, sent_in_period_query)
        late_reply_candidate_ids = sent_in_period_thread_ids - received_thread_ids

        for thread_id in late_reply_candidate_ids:
            try:
                thread_details = service.users().threads().get(userId='me', id=thread_id, format='full').execute()
                messages = thread_details.get('messages', [])
                if not messages: continue

                messages_with_dates = [{'id': m['id'], 'date': parse_date(get_header(m['payload']['headers'], 'Date')), 'subject': get_header(m['payload']['headers'], 'Subject'), 'labelIds': m.get('labelIds', [])} for m in messages]
                messages_with_dates.sort(key=lambda x: x['date'] if x['date'] else datetime.min.astimezone())
                original_email_msg = messages_with_dates[0]

                if original_email_msg['date'] and original_email_msg['date'] < start_date_dt:
                    sent_messages = [m for m in messages_with_dates if 'SENT' in m['labelIds']]
                    if not sent_messages: continue
                    first_ever_reply = sent_messages[0]
                    
                    detail_to_add = {
                        'thread_id': thread_id,
                        'subject': original_email_msg['subject'],
                        'original_date': original_email_msg['date'].isoformat(),
                        'first_reply_date': first_ever_reply['date'].isoformat()
                    }

                    if first_ever_reply['date'] and start_date_dt <= first_ever_reply['date'] <= end_date_dt:
                        late_replies_data['incorrect_first_reply'] += 1
                        late_replies_data['incorrect_details'].append(detail_to_add)
                    else:
                        late_replies_data['correct_continued_reply'] += 1
                        late_replies_data['correct_details'].append(detail_to_add)
            except HttpError as e: print(f"Skipping late reply thread {thread_id} due to API error: {e}")
        
        debug_inbox_query = ' '.join(final_query_parts + ['in:inbox'])
        debug_sent_query = ' '.join(final_query_parts + ['in:sent'])
        raw_inbox_list = fetch_raw_list(service, debug_inbox_query)
        raw_sent_list = fetch_raw_list(service, debug_sent_query)
        
        debug_data = {
            "raw_inbox": raw_inbox_list,
            "raw_sent": raw_sent_list
        }

        return jsonify({
            "status": "success",
            "data": {
                "details": email_details,
                "late_replies": late_replies_data,
                "debug_data": debug_data
            }
        })
    except InvalidGrantError:
        session.pop('credentials', None)
        session.pop('user_info', None)
        return jsonify({"error": "Authorization has expired or been revoked. Please log in again."}), 401
    except Exception as e: return jsonify({"error": f"Failed to fetch emails: {str(e)}"}), 500

@app.route('/api/verify_reply', methods=['POST'])
def verify_reply():
    if 'credentials' not in session: return jsonify({"error": "User not authenticated"}), 401
    
    data = request.get_json()
    original_sender = data.get('sender')
    subject = data.get('subject')

    if not original_sender or not subject:
        return jsonify({"error": "Missing sender or subject for verification"}), 400

    try:
        credentials = Credentials(**session['credentials'])
        service = build('gmail', 'v1', credentials=credentials)
        
        sender_email = email.utils.parseaddr(original_sender)[1]
        
        query = f'in:sent to:"{sender_email}" subject:"{subject}"'
        results = service.users().messages().list(userId='me', q=query, maxResults=1).execute()
        
        if results.get('messages'):
            msg_id = results['messages'][0]['id']
            message = service.users().messages().get(userId='me', id=msg_id).execute()
            reply_date_str = get_header(message['payload']['headers'], 'Date')
            reply_date = parse_date(reply_date_str)
            return jsonify({"found": True, "reply_date": reply_date.isoformat() if reply_date else None})
        else:
            return jsonify({"found": False})
            
    except InvalidGrantError:
        return jsonify({"error": "Authorization has expired or been revoked. Please log in again."}), 401
    except Exception as e:
        return jsonify({"error": f"Failed to verify reply: {str(e)}"}), 500

@https_fn.on_request()
def gmail_api_handler(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()
