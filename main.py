#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import mimetypes
import os
import simplejson
from cairosvg import svg2png
import PIL
import sys
import io
import json
import shutil

class RequestHandler(BaseHTTPRequestHandler):
    # def _set_response(self):
    #     pass
    def do_GET(self):
        if self.path.endswith('favicon.ico'):
            return
        root = os.path.dirname(os.path.abspath(__file__))
        if self.path == "/":
            self.path = "/index.html"
        filename = root + self.path

        file = open(filename, "rb")
        self.send_response(200)
        self.send_header("Content-type", mimetypes.guess_type(filename)[0])
        self.end_headers()
        shutil.copyfileobj(file,self.wfile)
        file.close()

    def do_POST(self):
        if self.path == "/downloadImage":
            data_string = self.rfile.read(int(self.headers['Content-Length']))
            data = data_string.decode("utf-8")

            svg_path = PIL.Image.open(io.BytesIO(svg2png(bytestring=data)))
            field = PIL.Image.open("field.png")
            svg_path = svg_path.resize(
                (field.size[0], field.size[1]), PIL.Image.ANTIALIAS)

            field.paste(svg_path, (0, 0), svg_path)
            field.save("out.png")
            self.send_response(200)


def main():

    server_address = ('', 8080)
    httpd = HTTPServer(server_address, RequestHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()


if __name__ == '__main__':
    main()
