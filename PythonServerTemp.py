# serve_with_cors.py
import http.server
import socketserver

PORT = 8000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        return super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"Serving with CORS at http://localhost:{PORT}")
        httpd.serve_forever()