#!/usr/bin/env python
# This is a simplified, cleaned version of the portfolio without the confusing #commande references

import http.server
import socketserver
import os
import sys

class SimpleHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        # Serve the files from the current directory
        super().do_GET()

    def log_message(self, format, *args):
        # Suppress log messages
        pass

def main():
    PORT = 8080
    try:
        with socketserver.TCPServer(("", PORT), SimpleHandler) as httpd:
            print(f"Serving on port {PORT}")
            httpd.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e):
            print('Port 8080 already in use')
        else:
            print(f"Error starting server: {e}")
            sys.exit(1)
    except KeyboardInterrupt:
        print('\nServer stopped')
        sys.exit(0)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
