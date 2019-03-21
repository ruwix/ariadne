#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import mimetypes
import json
from cairosvg import svg2png
from PIL import Image
import os
from io import BytesIO
from shutil import copyfileobj
from base64 import b64encode
from networktables import NetworkTables


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.endswith("favicon.ico"):
            return
        if self.path == "/Ariadne":
            pose = NetworkTables.getTable(tablename).getNumberArray("Pose", [])
            if pose != []:
                print(pose)
                self.send_response(200)
                self.send_header("Content-Type", "appilcation/json")
                self.end_headers()
                data = json.dumps(
                    {"x": pose[0], "y": pose[1], "heading": pose[2]}
                ).encode(encoding="utf_8")
                self.wfile.write(data)
            else:
                self.send_error(500, "No odometry data found.")
            return
        root = os.path.dirname(os.path.abspath(__file__))
        if self.path == "/":
            self.path = "/index.html"
        filename = root + self.path

        file = open(filename, "rb")
        self.send_response(200)
        self.send_header(
            "Content-type", mimetypes.guess_type(filename)[0] + "; charset=utf-8"
        )
        self.end_headers()
        copyfileobj(file, self.wfile)
        file.close()

    def do_POST(self):
        pass


ip = "127.0.0.1"
tablename = "Ariadne"


def _connectionListener(connected, info):
    print(info, "; Connected=%s" % connected)


def main():
    NetworkTables.initialize(server=ip)
    NetworkTables.addConnectionListener(_connectionListener, immediateNotify=True)
    server_address = ("", 8080)
    httpd = HTTPServer(server_address, RequestHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()


if __name__ == "__main__":
    main()
