#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
python3 - <<'PY'
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import threading, webbrowser
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript'}
server = None
for port in range(4174, 4185):
    try:
        server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
        break
    except OSError:
        continue
if server is None:
    raise SystemExit('Available local port not found. Close an older preview and try again.')
url = f'http://127.0.0.1:{server.server_port}/'
print('\nSYNCHRONOS  '+url+'\nKeep this Terminal window open. Press Control+C to stop.\n', flush=True)
threading.Timer(.4, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
PY
