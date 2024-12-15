from flask import Flask, request, Response
import requests
from urllib.parse import urljoin

app = Flask(__name__)

# Target server configuration
TARGET_SERVER = "http://172.86.83.9:51821"  # Replace with your target website

# Headers that should not be forwarded
EXCLUDED_HEADERS = [
    'content-encoding',
    'content-length',
    'transfer-encoding',
    'connection',
    'host'
]

def get_proxied_response(request):
    """Handle the proxied request and return the response"""
    # Build the target URL
    url = urljoin(TARGET_SERVER, request.path)
    if request.query_string:
        url += '?' + request.query_string.decode()

    # Get request headers
    headers = {k: v for k, v in request.headers.items() if k.lower() not in EXCLUDED_HEADERS}
    
    # Forward the client's IP and protocol
    headers['X-Forwarded-For'] = request.remote_addr
    headers['X-Forwarded-Proto'] = request.scheme
    headers['X-Forwarded-Host'] = request.host

    try:
        # Make the request to the target server
        resp = requests.request(
            method=request.method,
            url=url,
            headers=headers,
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False,
            stream=True
        )

        # Prepare response headers
        excluded_headers = [header.lower() for header in EXCLUDED_HEADERS]
        headers = [(k, v) for k, v in resp.raw.headers.items() if k.lower() not in excluded_headers]

        # Create response
        response = Response(
            resp.iter_content(chunk_size=10*1024),
            status=resp.status_code,
            headers=headers
        )

        return response

    except requests.exceptions.RequestException as e:
        return Response(f"Proxy error: {str(e)}", status=500)

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path):
    """Main proxy route that handles all paths"""
    return get_proxied_response(request)


app = app
