var wto;
var waypoints = []
var ROBOT_WIDTH = 35.45;
var ROBOT_HEIGHT = 33.325;
var FIELD_WIDTH_INCHES = 652;
var FIELD_HEIGHT_INCHES = 324;

var Pose = function (x, y, heading) {
    this.x = x || 0;
    this.y = y || 0;
    this.heading = heading || 0;
};

var Waypoint = function (x, y, heading, speed, comment) {
    this.pose = new Pose(x, y, heading);
    this.speed = speed || 60;
    this.comment = comment || "";
}

function init() {
    bindInputs();
    drawRobots();
    addPoint();
    addPoint();
}

function drawRobot(index) {
    var svg = $('#field');
    var x = waypoints[index].pose.x;
    var y = waypoints[index].pose.y;

    var newGroup = $(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    $(newGroup).attr({
        transform: "rotate(" + -waypoints[index].pose.heading + " " + x + " " + y + ")",
    });
    var newRect = $(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
    $(newRect).attr({
        width: ROBOT_WIDTH,
        height: ROBOT_HEIGHT,
        x: x - ROBOT_WIDTH / 2,
        y: y - ROBOT_HEIGHT / 2,
        "stroke-width": 3,
        class: "robot",
        stroke: "#F78C6C",
        fill: "transparent",
    });
    var newLine = $(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
    $(newLine).attr({
        x1: x,
        y1: y,
        x2: x + ROBOT_WIDTH / 2 - 1,
        y2: y,
        "stroke-width": 3,
        stroke: "#FF5370",
        fill: "transparent",
    });
    newRect.appendTo(newGroup);
    newLine.appendTo(newGroup);

    newGroup.appendTo(svg);
}

function drawRobots() {
    if (waypoints.length > 0) {
        drawRobot(0);
    }
    if (waypoints.length > 1) {
        drawRobot(waypoints.length - 1);
    }
}

function update() {
    waypoints = [];
    var svg = $('#field');
    svg.empty();
    $('tbody').children('tr').each(function () {
        var x = parseInt($($($(this).children()).children()[0]).val());
        var y = parseInt($($($(this).children()).children()[1]).val());
        var heading = parseInt($($($(this).children()).children()[2]).val());
        var speed = parseInt($($($(this).children()).children()[3]).val());
        let enabled = ($($($(this).children()).children()[5]).prop('checked'));
        if (isNaN(heading)) {
            heading = 0;
        }
        if (isNaN(speed)) {
            speed = 60;
        }
        var comment = ($($($(this).children()).children()[4]).val())
        if (enabled) {
            waypoints.push(new Waypoint(x, y, heading, speed, comment));
        }
    });
    drawRobots();
    drawPoses();
    makePointDraggable($(".draggable"));
}

function drawPoses() {
    var svg = $('#field');
    for (var i = 0; i < waypoints.length; i++) {
        if (waypoints.length > 1 && i != waypoints.length - 1) {
            path = "M " + waypoints[i].pose.x + " " + waypoints[i].pose.y
            for (var t = 0; t < 1; t += 0.01) {
                var point = interpolatePoint(t, waypoints[i].pose, waypoints[i + 1].pose);
                path += " L " + point.x + " " + point.y + " ";
            }
            path += " L " + waypoints[i + 1].pose.x + " " + waypoints[i + 1].pose.y;

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
            cx: waypoints[i].pose.x,
            cy: waypoints[i].pose.y,
            class: "draggable waypoint",
            r: 5,
            fill: "#FF5370",
        });
        newCircle.appendTo(svg);
    }
}

function addPoint() {
    var prev;
    if (waypoints.length > 0) {
        prev = waypoints[waypoints.length - 1].pose;
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
function exportData() {
    var title = getTitle();
    if (!title) {
        return;
    }
    var jsonPoses = JSON.stringify(waypoints, null, 1);
    download(jsonPoses, title + ".json", 'text/plain');
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
            var parse = JSON.parse(c);
            waypoints = []
            $("tbody").empty();
            var title = fr.fileName.split('.').slice(0, -1).join('.')
            $("#title").val(title);
            parse.forEach((waypoint) => {
                appendTable(waypoint.pose.x, waypoint.pose.y, waypoint.pose.heading, waypoint.speed, waypoint.comment);
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

function appendTable(x = 50, y = 50, heading = 0, speed = 60, comment = "") {
    $("tbody").append("<tr>" +
        "<td><input type='number' value='" + (x) + "'></td>" +
        "<td><input type='number' value='" + (y) + "'></td>" +
        "<td><input type='number' value='" + heading + "'></td>" +
        "<td><input type='number' value='" + speed + "'></td>" +
        "<td class='comments'><input placeholder='Comments' value='" + comment + "'></td>" +
        "<td><input type='checkbox' checked></td>" +
        "<td><button onclick='$(this).parent().parent().remove();update()'>Delete</button></td></tr>"
    );
}

function downloadImage() {
    var svg = $("#field");
    var title = getTitle();
    if (!title) {
        return;
    }
    $.ajax({
        type: 'POST',
        url: '/downloadImage',
        data: JSON.stringify({
            svgData: svg[0].outerHTML,
            title: title,
        }),
        contentType: 'application/json',
        dataType: 'text',
        success: function (msg) {
            var byteCharacters = atob(msg);
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            download(byteArray, title + ".png", "image/png");
        }
    });
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