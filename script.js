
var Pose = function (x, y, heading) {
    this.x = x || 0;
    this.y = y || 0;
    this.heading = heading || 0;
};

var wto;
var odometry_interval;
var poses = [];
var odometry_enabled = false;
var ROBOT_WIDTH = 1;
var ROBOT_HEIGHT = 1;
var FIELD_WIDTH_PIXELS = 815;
var FIELD_HEIGHT_PIXELS = 405;
var FIELD_WIDTH_METERS = 16.5608;
var FIELD_HEIGHT_METERS = 8.2296;
var PIXELS_PER_METER = FIELD_WIDTH_PIXELS / FIELD_WIDTH_METERS;
var METERS_PER_PIXEL = FIELD_WIDTH_METERS / FIELD_WIDTH_PIXELS;

var svg = $('#field');

function init() {
    svg.attr({ width: FIELD_WIDTH_PIXELS, height: FIELD_HEIGHT_PIXELS })
    $("#poseinput").sortable({
        stop: update
    })
    if (!odometry_enabled) {
        $("#odometry").attr({ display: "none", d: "" })
        $("#robot_odometry").attr({ display: "none" })
    }
    bindInputs();
    initRobots();
    addPoint();
    addPoint();
}

function initRobots() {
    $('.robot').each(function () {
        var rect = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
        $(rect).attr({
            width: ROBOT_WIDTH * PIXELS_PER_METER,
            height: ROBOT_HEIGHT * PIXELS_PER_METER,
            x: -ROBOT_WIDTH / 2 * PIXELS_PER_METER,
            y: -ROBOT_HEIGHT / 2 * PIXELS_PER_METER,
            "stroke-width": 3,
            stroke: "#F78C6C",
            fill: "transparent",
        });
        var line = $(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
        $(line).attr({
            x1: 0,
            y1: 0,
            x2: (ROBOT_WIDTH / 2) * PIXELS_PER_METER,
            y2: 0,
            "stroke-width": 3,
            stroke: "#FF5370",
            fill: "transparent",
        });
        rect.appendTo($(this));
        line.appendTo($(this));
    })
}

function update() {
    poses = [];
    $('#poseinput').children('tr').each(function () {
        var x = parseFloat($($($(this).children()).children()[0]).val());
        var y = parseFloat($($($(this).children()).children()[1]).val());
        var heading = parseInt($($($(this).children()).children()[2]).val());
        var enabled = ($($($(this).children()).children()[3]).prop('checked'));
        if (enabled) {
            poses.push(new Pose(x, y, heading));
        }
    });
    updateRobots();
    updatePath();
    makePointDraggable($(".draggable"));
}

function updateRobot(id, pose) {
    $("#" + id).attr({
        id: id,
        transform: "translate( " + pose.x * PIXELS_PER_METER + ", " + pose.y * PIXELS_PER_METER + ")" + "rotate(" + -pose.heading + " 0 0 )",
    });
}


function updateRobots() {
    if (poses.length > 0) {
        $("#robot_start").attr({
            display: "block"
        });
        updateRobot("robot_start", poses[0]);
    }
    else {
        $("#robot_start").attr({
            display: "none"
        });
    }
    if (poses.length > 1) {
        $("#robot_end").attr({
            display: "block"
        });
        updateRobot("robot_end", poses[poses.length - 1]);
    }
    else {
        $("#robot_end").attr({
            display: "none"
        });
    }
}



function updatePath() {
    $("#points").empty()
    var path = "M " + poses[0].x * PIXELS_PER_METER + " " + poses[0].y * PIXELS_PER_METER;
    for (var i = 0; i < poses.length; i++) {
        if (poses.length > 1 && i != poses.length - 1) {
            for (var t = 0; t < 1; t += 0.01) {
                var point = interpolatePoint(t, poses[i], poses[i + 1]);
                path += " L " + point.x * PIXELS_PER_METER + " " + point.y * PIXELS_PER_METER + " ";
            }
            path += " L " + poses[i + 1].x * PIXELS_PER_METER + " " + poses[i + 1].y * PIXELS_PER_METER;
        }
        var circle = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
        $(circle).attr({
            cx: poses[i].x * PIXELS_PER_METER,
            cy: poses[i].y * PIXELS_PER_METER,
            class: "draggable waypoint",
            r: 5,
            fill: "#FF5370",
        });
        circle.appendTo($("#points"));
    }
    $("#path").attr({
        d: path,
    });
}


function addPoint() {
    var prev;
    if (poses.length > 0) {
        prev = poses[poses.length - 1];
    }
    else {
        prev = new Pose(0.5, 0.5, 0);
    }
    appendTable(prev.x + 0.5, prev.y + 0.5);
    update();
    bindInputs();
}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function readCSV(data) {
    var allTextLines = data.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var lines = [];

    for (var i = 1; i < allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {

            var tarr = [];
            for (var j = 0; j < headers.length; j++) {
                tarr.push(parseFloat(data[j]));
            }
            lines.push(tarr);
        }
    }
    return lines
}

function exportData() {
    var title = getTitle();
    if (!title) {
        return;
    }
    var csv_path = objectToCSV(poses);
    download(csv_path, title + ".csv", 'text/plain');
}

function getTitle() {
    var title = $('#title').val();
    if (!title) {
        window.alert("Please set the title");
        return;
    }
    return title;
}

function importData() {
    $('#upload').click();
    let u = $('#upload')[0];
    $('#upload').change(() => {
        var file = u.files[0];
        var fr = new FileReader();
        fr.fileName = file.name;
        fr.onload = function (e) {
            var c = fr.result;
            var parse = readCSV(c);
            poses = []
            $("#poseinput").empty();
            var title = fr.fileName.split('.').slice(0, -1).join('.')
            $("#title").val(title);
            parse.forEach((pose) => {
                appendTable(pose[0], pose[1], pose[2]);
            });
            update();
            bindInputs();
        }
        fr.readAsText(file);
    });
}

function bindInputs() {
    $('input').on("propertychange change click keyup input paste", function () {
        clearTimeout(wto);
        wto = setTimeout(function () {
            update();
        }, 100);
    });
}

function appendTable(x = 0, y = 0, heading = 0) {
    $("#poseinput").append("<tr>" +
        "<td><input type='number' value='" + (x) + "' step='0.01'></td>" +
        "<td><input type='number' value='" + (y) + "' step='0.01'></td>" +
        "<td><input type='number' value='" + heading + "'></td>" +
        "<td><input type='checkbox' checked></td>" +
        "<td><button onclick='$(this).parent().parent().remove();update()'>Delete</button></td></tr>"
    );
}


function makePointDraggable(point) {
    point.draggable()
        .on('mouseup', function (event) {
            update();
        })
        .on('drag', function (event) {
            var circles = Array.prototype.slice.call(document.getElementsByTagName('circle'));
            var index = circles.indexOf(event.target);
            var svg = $("#field");
            var x = (event.clientX - svg[0].getBoundingClientRect().left);
            var y = (event.clientY - svg[0].getBoundingClientRect().top);
            $(event.target).attr({
                cx: x,
                cy: y,
            });
            $($($($($('#poseinput').children('tr')[index]).children()).children())[0]).val(x * METERS_PER_PIXEL);
            $($($($($('#poseinput').children('tr')[index]).children()).children())[1]).val(y * METERS_PER_PIXEL);
        });
}

function objectToCSV(data) {
    var columnDelimiter = ',';
    var lineDelimiter = '\n'

    var keys = Object.keys(data[0]);

    var result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function (item) {
        var i = 0;
        keys.forEach(function (key) {
            if (i > 0) result += columnDelimiter;
            result += item[key];
            i++;
        });
        result += lineDelimiter;
    });

    return result;
}

function toggleOdometry() {
    odometry_enabled = !odometry_enabled;
    if (!odometry_enabled) {
        clearInterval(odometry_interval);
        $("#odometry").attr({ display: "none", d: "" })
        $("#robot_odometry").attr({ display: "none" })
        $("#toggle_odometry").text("Enable Odometry")
    }
    else {
        $("#toggle_odometry").text("Disable Odometry")
        var path = "";
        var last_val = new Pose(0, 0, 0);
        odometry_interval = setInterval(function () {
            $.ajax({
                type: 'POST',
                url: '/RobotOdyssey',
                data: JSON.stringify({}),
                contentType: 'application/json',
                dataType: 'text',
                success: function (msg) {
                    var data = JSON.parse(msg);
                    data.x;
                    data.y;
                    var EPSILON = 0.001;
                    if (Math.abs(last_val.x - data.x) >= EPSILON || Math.abs(last_val.y - data.y) >= EPSILON || Math.abs(last_val.heading - data.heading) >= EPSILON) {
                        if (path == "") {
                            path = "M " + data.x * PIXELS_PER_METER + " " + data.y * PIXELS_PER_METER
                        }
                        else {
                            path += " L " + data.x * PIXELS_PER_METER + " " + data.y * PIXELS_PER_METER;
                        }
                        $("#robot_odometry").attr({ display: "block", transform: "translate( " + data.x * PIXELS_PER_METER + ", " + data.y * PIXELS_PER_METER + ")" + " rotate(" + (data.heading * 180 / Math.PI) + " 0 0 )" });
                        $("#odometry").attr({ display: "block", d: path })
                    }
                    last_val = data;
                }
            });

        }, 100);
    }
}

function invertPath() {
    for (var i = 0; i < poses.length; i++) {
        var x = poses[i].x;
        var y = FIELD_HEIGHT_METERS - poses[i].y;
        var heading = poses[i].heading;
        $($($($($('#poseinput').children('tr')[i]).children()).children())[0]).val(x);
        $($($($($('#poseinput').children('tr')[i]).children()).children())[1]).val(y);
        $($($($($('#poseinput').children('tr')[i]).children()).children())[2]).val(Math.round(-heading));
    }
    update();
    bindInputs();
}
