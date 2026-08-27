#!/usr/bin/env python3
"""Local dev server for the portfolio.

Plain `python3 -m http.server` lets the browser cache ES modules and CSS hard,
so edits appear not to take effect. This sends no-store on everything.

    python3 serve.py            # http://localhost:8000
    python3 serve.py 3000       # a different port
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"\n  Portfolio → http://localhost:{port}\n  Ctrl+C to stop\n")
    try:
        ThreadingHTTPServer(("", port), NoCacheHandler).serve_forever()
    except KeyboardInterrupt:
        print("\n  stopped\n")
