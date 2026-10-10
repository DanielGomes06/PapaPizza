"""Testes do site Papa Pizza (somente biblioteca padrão do Python).

Rodam dentro do container: python -m unittest discover -s tests -v
Como o container é Linux, nomes de arquivo diferenciam maiúsculas de
minúsculas. Referências erradas que "funcionam" no Windows quebram aqui.
"""
import http.client
import re
import threading
import unittest
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_PREFIXES = ("http://", "https://", "//", "data:", "mailto:", "tel:", "#", "javascript:")
JS_IMPORT = re.compile(
    r"""(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"](\.{1,2}/[^'"]+)['"]"""
    r"""|import\(\s*['"](\.{1,2}/[^'"]+)['"]\s*\)"""
)


class _Refs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "link" and a.get("href"):
            self.refs.append(a["href"])
        elif tag in ("script", "img", "source") and a.get("src"):
            self.refs.append(a["src"])


def _local(ref):
    ref = ref.strip()
    if not ref or ref.startswith(SKIP_PREFIXES):
        return None
    return ref.split("#")[0].split("?")[0]


def _html_refs():
    parser = _Refs()
    parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    return [r for r in map(_local, parser.refs) if r]


class SiteStructureTests(unittest.TestCase):
    def test_index_exists(self):
        self.assertTrue((ROOT / "index.html").is_file(), "index.html não encontrado")

    def test_html_local_references_exist(self):
        missing = [r for r in _html_refs() if not (ROOT / r.lstrip("/")).is_file()]
        self.assertEqual(missing, [], f"Arquivos referenciados no index.html não existem: {missing}")

    def test_js_relative_imports_exist(self):
        missing = []
        for js in ROOT.rglob("*.js"):
            if "node_modules" in js.parts:
                continue
            for m in JS_IMPORT.finditer(js.read_text(encoding="utf-8", errors="ignore")):
                target = (js.parent / (m.group(1) or m.group(2))).resolve()
                if not target.is_file():
                    missing.append(f"{js.relative_to(ROOT)} -> {m.group(1) or m.group(2)}")
        self.assertEqual(missing, [], f"Imports JS quebrados: {missing}")


class _QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class ServerSmokeTests(unittest.TestCase):
    """Sobe o mesmo servidor do Dockerfile (http.server) e pede as páginas."""

    @classmethod
    def setUpClass(cls):
        handler = partial(_QuietHandler, directory=str(ROOT))
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.port = cls.server.server_address[1]
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def _status(self, path):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        conn.request("GET", path)
        status = conn.getresponse().status
        conn.close()
        return status

    def test_home_returns_200(self):
        self.assertEqual(self._status("/"), 200)

    def test_assets_referenced_by_html_return_200(self):
        for ref in _html_refs():
            with self.subTest(ref=ref):
                self.assertEqual(self._status("/" + ref.lstrip("/")), 200)


if __name__ == "__main__":
    unittest.main()
