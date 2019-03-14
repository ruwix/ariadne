var Vector = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;
};

function radians(degrees) {
    return degrees * (Math.PI / 180);
}

function interpolatePoint(t, pose0, pose1) {
    pose0 = pose0;
    pose1 = pose1;
    scale = 2 * Math.sqrt(Math.pow(pose1.x - pose0.x, 2) + Math.pow(pose1.y - pose0.y, 2));
    dx0 = scale * Math.cos(-radians(pose0.heading));
    dx1 = scale * Math.cos(radians(pose1.heading));
    ax = dx0 + dx1 + 2 * pose0.x - 2 * pose1.x;
    bx = -2 * dx0 - dx1 - 3 * pose0.x + 3 * pose1.x;
    cx = dx0;
    dx = pose0.x;
    dy0 = scale * Math.sin(-radians(pose0.heading));
    dy1 = scale * Math.sin(-radians(pose1.heading));
    ay = dy0 + dy1 + 2 * pose0.y - 2 * pose1.y;
    by = -2 * dy0 - dy1 - 3 * pose0.y + 3 * pose1.y;
    cy = dy0;
    dy = pose0.y;
    x = ax * t * t * t + bx * t * t + cx * t + dx;
    y = ay * t * t * t + by * t * t + cy * t + dy;
    var ret = new Vector(x, y);
    return ret;
}
