
var Pose = function (x, y, heading) {
    this.x = x || 0;
    this.y = y || 0;
    this.heading = heading || 0;
};

var wto;
var odometry_interval;
var poses = [];
var odometry_enabled = false;
var ROBOT_WIDTH = 35.45;
var ROBOT_HEIGHT = 33.325;
var FIELD_WIDTH_INCHES = 652;
var FIELD_HEIGHT_INCHES = 324;
var svg = $('#field');


function init() {
    bindInputs();
    drawRobots();
    addPoint();
    addPoint();
}

function drawRobot(pose, id) {
    var newGroup = $(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    $(newGroup).attr({
        id: id,
        transform: "rotate(" + -pose.heading + " " + pose.x + " " + pose.y + ")",
    });
    var newRect = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
    $(newRect).attr({
        id: id + "rect",
        width: ROBOT_WIDTH,
        height: ROBOT_HEIGHT,
        x: pose.x - ROBOT_WIDTH / 2,
        y: pose.y - ROBOT_HEIGHT / 2,
        "stroke-width": 3,
        class: "robot",
        stroke: "#F78C6C",
        fill: "transparent",
    });
    var newLine = $(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
    $(newLine).attr({
        id: id + "line",
        x1: pose.x,
        y1: pose.y,
        x2: pose.x + ROBOT_WIDTH / 2 - 1,
        y2: pose.y,
        "stroke-width": 3,
        stroke: "#FF5370",
        fill: "transparent",
    });
    newRect.appendTo(newGroup);
    newLine.appendTo(newGroup);
    newGroup.appendTo(svg);
}


function drawRobots() {
    if (poses.length > 0) {
        drawRobot(poses[0], "startrobot");
    }
    if (poses.length > 1) {
        drawRobot(poses[poses.length - 1], "endrobot");
    }
}

function update() {
    poses = [];
    var svg = $('#field');
    svg.empty();
    $('tbody').children('tr').each(function () {
        var x = parseInt($($($(this).children()).children()[0]).val());
        var y = parseInt($($($(this).children()).children()[1]).val());
        var heading = parseInt($($($(this).children()).children()[2]).val());
        var enabled = ($($($(this).children()).children()[3]).prop('checked'));
        if (enabled) {
            poses.push(new Pose(x, y, heading));
        }
    });
    drawRobots();
    drawPoses();
    makePointDraggable($(".draggable"));
}

function drawPoses() {
    var svg = $('#field');
    for (var i = 0; i < poses.length; i++) {
        if (poses.length > 1 && i != poses.length - 1) {
            path = "M " + poses[i].x + " " + poses[i].y
            for (var t = 0; t < 1; t += 0.01) {
                var point = interpolatePoint(t, poses[i], poses[i + 1]);
                path += " L " + point.x + " " + point.y + " ";
            }
            path += " L " + poses[i + 1].x + " " + poses[i + 1].y;

            var newPath = $(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
            $(newPath).attr({
                d: path,
                class: "path",
                "stroke-width": 3,
                stroke: "#C3E88D",
                fill: "transparent",
            });
            newPath.appendTo(svg);
        }
        var newCircle = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));

        $(newCircle).attr({
            cx: poses[i].x,
            cy: poses[i].y,
            class: "draggable waypoint",
            r: 5,
            fill: "#FF5370",
        });
        newCircle.appendTo(svg);
    }
}


function addPoint() {
    var prev;
    if (poses.length > 0) {
        prev = poses[poses.length - 1];
    }
    else {
        prev = new Pose(36, 36, 0);
    }
    appendTable(prev.x + 24, prev.y + 24);
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
            $("tbody").empty();
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

function appendTable(x = 50, y = 50, heading = 0) {
    $("tbody").append("<tr>" +
        "<td><input type='number' value='" + (x) + "'></td>" +
        "<td><input type='number' value='" + (y) + "'></td>" +
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
            var x = event.clientX - svg[0].getBoundingClientRect().left;
            var y = event.clientY - svg[0].getBoundingClientRect().top;
            $(event.target).attr({
                cx: x,
                cy: y,
            });
            $($($($($('tbody').children('tr')[index]).children()).children())[0]).val(Math.round(x));
            $($($($($('tbody').children('tr')[index]).children()).children())[1]).val(Math.round(y));
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


function drawOdometry() {
    if (odometry_enabled) {
        clearInterval(odometry_interval);
        $("#odometrypath").remove()
        $("#odometryrobot").remove()
        odometry_enabled = false;
        $("#odometry").text("Enable Odometry")
    }
    else {
        $("#odometry").text("Disable Odometry")
        var svg = $('#field');
        var path = "";
        var newPath = $(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
        var drawn = false;
        var last_val = new Pose(0, 0, 0);
        $(newPath).attr({
            id: "odometrypath",
            d: path,
            class: "path",
            "stroke-width": 3,
            stroke: "#C3E88D",
            fill: "transparent",
        });
        newPath.appendTo(svg);
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
                    var EPSILON = 0.1;
                    if (Math.abs(last_val.x - data.x) >= EPSILON || Math.abs(last_val.y - data.y) >= EPSILON || Math.abs(last_val.heading - data.heading) >= EPSILON) {
                        if (path == "") {
                            path = "M " + data.x + " " + data.y
                        }
                        else {
                            path += " L " + data.x + " " + data.y;
                        }
                        if (!drawn) {
                            drawRobot(data, "odometryrobot");
                            drawn = true;
                        }
                        else {
                            $("#odometryrobot").attr({ transform: "rotate(" + -data.heading + " " + data.x + " " + data.y + ")" });
                            $("#odometryrobotrect").attr({
                                "x": data.x - ROBOT_WIDTH / 2,
                                "y": data.y - ROBOT_HEIGHT / 2,
                            });
                            $("#odometryrobotline").attr({
                                "x1": data.x,
                                "y1": data.y,
                                "x2": data.x + ROBOT_WIDTH / 2 - 1,
                                "y2": data.y,
                            });
                        }
                        $("#odometrypath").attr("d", path)
                    }
                    last_val = data;
                }
            });
            odometry_enabled = true;

        }, 100);
    }
}

function invertPath() {
    for (var i = 0; i < poses.length; i++) {
        var x = poses[i].x;
        var y = FIELD_HEIGHT_INCHES - poses[i].y;
        $($($($($('tbody').children('tr')[i]).children()).children())[0]).val(Math.round(x));
        $($($($($('tbody').children('tr')[i]).children()).children())[1]).val(Math.round(y));
    }
    update();
    bindInputs();
}
