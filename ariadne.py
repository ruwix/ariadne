#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import mimetypes
import json
import os
from shutil import copyfileobj
from networktables import NetworkTables
from hermitespline import HermiteSpline
import numpy as np
from geometry import *


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.endswith("favicon.ico"):
            return
        if self.path == "/Odometry":
            pose = NetworkTables.getTable(tablename).getNumberArray("Pose", [])
            if pose != []:
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
        if self.path == "/Path":
            data_string = self.rfile.read(int(self.headers["Content-Length"]))
            data = json.loads(data_string)
            poses = np.array([])
            for d in data:
                poses = np.append(
                    poses, Pose(d["x"], d["y"], np.deg2rad(d["heading"]))
                )
            spline = HermiteSpline(poses)
            path = np.array([])
            sample_size = 0.01
            for i in range(0, int(spline.length / sample_size)):
                path = np.append(path, spline.getPose(i * sample_size))
            ret = []
            for p in path:
                ret.append({"x": p.x, "y": p.y, "heading": p.theta})
            json_data = json.dumps(ret).encode(encoding="utf_8")
            self.send_response(200)
            self.send_header("Content-Type", "appilcation/json")
            self.end_headers()
            self.wfile.write(json_data)


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
