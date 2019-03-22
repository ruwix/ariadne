class Pose {
    constructor(x = 0, y = 0, heading = 0) {
        this.x = x;
        this.y = y;
        this.heading = heading;
    }
}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

var ROBOT_WIDTH = 1;
var ROBOT_HEIGHT = 1;
var FIELD_WIDTH_PIXELS = 815;
var FIELD_HEIGHT_PIXELS = 405;
var FIELD_WIDTH_METERS = 16.5608;
var FIELD_HEIGHT_METERS = 8.2296;
var PIXELS_PER_METER = FIELD_WIDTH_PIXELS / FIELD_WIDTH_METERS;
var METERS_PER_PIXEL = FIELD_WIDTH_METERS / FIELD_WIDTH_PIXELS;
var ODOMETRY_EPSILON = 0.001;

var wto;
var odometry_interval;
var poses = [];
var path_poses = [];
var odometry_enabled = false;
var svg = $('#field');

function init() {
    svg.attr({
        width: FIELD_WIDTH_PIXELS,
        height: FIELD_HEIGHT_PIXELS
    })
    $("#poseInput").sortable({
        stop: update
    })
    if (!odometry_enabled) {
        $("#odometry").hide().attr({
            d: ""
        });
        $("#robotOdometry").hide();
    }
    rebind();
    initRobots();
    addPoint();
    addPoint();
}

function initRobots() {
    $('.robot').each(function () {
        let width = ROBOT_WIDTH * PIXELS_PER_METER;
        let height = ROBOT_WIDTH * PIXELS_PER_METER;
        let rect = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
        $(rect).attr({
            width: width,
            height: height,
            x: -width / 2,
            y: -height / 2,
        });
        let line = $(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
        $(line).attr({
            x1: 0,
            y1: 0,
            x2: width / 2,
            y2: 0,
        });
        rect.appendTo($(this));
        line.appendTo($(this));
    })
}

function update() {
    poses = [];
    $('#poseInput').children('tr').each(function () {
        let x = parseFloat($($($(this).children()).children()[0]).val());
        let y = parseFloat($($($(this).children()).children()[1]).val());
        let heading = parseInt($($($(this).children()).children()[2]).val());
        let enabled = ($($($(this).children()).children()[3]).prop('checked'));
        if (!(isNaN(x) || isNaN(y) || isNaN(heading))) {
            if (enabled) {
                poses.push(new Pose(round(x, 2), round(y, 2), round(heading, 2)));
            }
        }
    });
    updateRobots();
    drawCircles();
    makePointDraggable($(".draggable"));
    if (poses.length != 0) {
        $.post('/Path', JSON.stringify(poses), function (data) {
            path_poses = data;
            updatePath();
        });
    }
    rebind();
}

function addPoint() {
    let prev;
    if (poses.length > 0) {
        prev = poses[poses.length - 1];
    } else {
        prev = new Pose(0.5, 0.5, 0);
    }
    appendTable(prev.x + 0.5, prev.y + 0.5);
    update();
}

function appendTable(x = 0, y = 0, heading = 0) {
    $("#poseInput").append("<tr>" +
        "<td><input type='number' value='" + (round(x, 2)) + "' step='0.01'></td>" +
        "<td><input type='number' value='" + (round(y, 2)) + "' step='0.01'></td>" +
        "<td><input type='number' value='" + round(heading, 2) + "'></td>" +
        "<td><input type='checkbox' checked></td>" +
        "<td><button class='delete' onclick='$(this).parent().parent().remove();update()'>×</button></td></tr>"
    );
}

function rebind() {
    $('input').on("propertychange change click keyup input paste", function () {
        clearTimeout(wto);
        wto = setTimeout(function () {
            update();
        }, 100);
    });
}

function makePointDraggable(point) {
    point.draggable()
        .on('mouseup', function (event) {
            update();
        })
        .on('drag', function (event) {
            let circles = Array.prototype.slice.call(document.getElementsByTagName('circle'));
            let index = circles.indexOf(event.target);
            let x = (event.clientX - svg[0].getBoundingClientRect().left);
            let y = (event.clientY - svg[0].getBoundingClientRect().top);
            $(event.target).attr({
                cx: x,
                cy: y,
            });
            $($($($($('#poseInput').children('tr')[index]).children()).children())[0]).val(round(x * METERS_PER_PIXEL, 2));
            $($($($($('#poseInput').children('tr')[index]).children()).children())[1]).val(round(y * METERS_PER_PIXEL, 2));
        });
}

function updateRobot(id, pose) {
    $("#" + id).attr({
        id: id,
        transform: "translate( " + pose.x * PIXELS_PER_METER + ", " + pose.y * PIXELS_PER_METER + ")" + "rotate(" + -pose.heading + " 0 0 )",
    });
}

function updateRobots() {
    if (poses.length > 0) {
        updateRobot("robotStart", poses[0]);
        $("#robotStart").show();
    } else {
        $("#robotStart").hide();
    }
    if (poses.length > 1) {
        updateRobot("robotEnd", poses[poses.length - 1]);
        $("#robotEnd").show();
    } else {
        $("#robotEnd").hide();
    }
}

function drawCircles() {
    $("#points").empty()
    for (let i in poses) {
        let circle = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
        $(circle).attr({
            cx: poses[i].x * PIXELS_PER_METER,
            cy: poses[i].y * PIXELS_PER_METER,
            class: "draggable waypoint",
            r: 5,
            fill: "#FF5370",
        });
        circle.appendTo($("#points"));
    }
}

function updatePath() {
    if (poses.length == 0) {
        return;
    }
    let path = "M " + poses[0].x * PIXELS_PER_METER + " " + poses[0].y * PIXELS_PER_METER;
    if (poses.length > 1) {
        for (let i in path_poses) {
            path += " L " + path_poses[i].x * PIXELS_PER_METER + " " + path_poses[i].y * PIXELS_PER_METER + " ";
        }
    }
    path += "L " + poses[poses.length - 1].x * PIXELS_PER_METER + " " + poses[poses.length - 1].y * PIXELS_PER_METER;

    $("#path").attr({
        d: path,
    });
}

function invertPath() {
    for (let i in poses) {
        let x = poses[i].x;
        let y = FIELD_HEIGHT_METERS - poses[i].y;
        let heading = poses[i].heading;
        $($($($($('#poseInput').children('tr')[i]).children()).children())[0]).val(round(x,2));
        $($($($($('#poseInput').children('tr')[i]).children()).children())[1]).val(round(y,2));
        $($($($($('#poseInput').children('tr')[i]).children()).children())[2]).val(round(-heading,0));
    }
    update();
}

function toggleOdometry() {
    odometry_enabled = !odometry_enabled;
    if (!odometry_enabled) {
        clearInterval(odometry_interval);
        $("#odometry").hide().attr({
            d: ""
        })
        $("#robotOdometry").hide();
        $("#state").hide();
        $("#toggle_odometry").text("Enable Odometry")
    } else {
        $("#toggle_odometry").text("Disable Odometry")
        let path = "";
        let last_val = new Pose(0, 0, 0);
        odometry_interval = setInterval(function () {
            $.get('/Odometry', function (data) {
                let x = data.x.toFixed(2);
                let y = data.y.toFixed(2);
                let heading = (data.heading * 180 / Math.PI).toFixed(2);
                $("#state").text("(" + x + "m, " + y + "m, " + heading + "°)").show();
                if (Math.abs(last_val.x - data.x) >= ODOMETRY_EPSILON || Math.abs(last_val.y - data.y) >= ODOMETRY_EPSILON || Math.abs(last_val.heading - data.heading) >= ODOMETRY_EPSILON) {
                    if (path == "") {
                        path = "M " + data.x * PIXELS_PER_METER + " " + data.y * PIXELS_PER_METER
                    } else {
                        path += " L " + data.x * PIXELS_PER_METER + " " + data.y * PIXELS_PER_METER;
                    }
                    $("#robotOdometry").show().attr({
                        transform: "translate( " + data.x * PIXELS_PER_METER + ", " + data.y * PIXELS_PER_METER + ")" + " rotate(" + (data.heading * 180 / Math.PI) + " 0 0 )"
                    });
                    $("#odometry").show().attr({
                        d: path
                    })
                }
                last_val = data;
            });
        }, 200);
    }
}