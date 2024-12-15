from flask import Flask, request, Response
import requests

app = Flask(__name__)

TARGET_BASE_URL = "https://www.example.com"

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
def proxy(path):
    target_url = f"{TARGET_BASE_URL}/{path}"

    try:
        # Forward the incoming request to the target URL
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers={key: value for key, value in request.headers if key != "Host"},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False,
        )

        # Build the response to return to the client
        excluded_headers = ["content-encoding", "content-length", "transfer-encoding", "connection"]
        headers = {key: value for key, value in resp.headers.items() if key.lower() not in excluded_headers}

        return Response(resp.content, resp.status_code, headers)
    except Exception as e:
        print(f"Proxy error: {e}")
        return Response(f"An error occurred: {str(e)}", status=500)

# Vercel expects the app to be exported as `app`
app = app
