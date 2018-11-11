var wto;
var waypoints = []

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
    addPoint();
    addPoint();
}

function update() {
    waypoints = [];
    $('tbody').children('tr').each(function () {
        var x = parseInt($($($(this).children()).children()[0]).val());
        var y = parseInt($($($(this).children()).children()[1]).val());
        var heading = parseInt($($($(this).children()).children()[2]).val());
        var speed = parseInt($($($(this).children()).children()[3]).val());
        if (isNaN(heading) || isNaN(speed)) {
            heading = 0;
            speed = 60;
        }
        var comment = ($($($(this).children()).children()[4]).val())
        waypoints.push(new Waypoint(x, y, heading, speed, comment));
    });
    drawPoses();
}

function drawPoses() {
    var svg = $('#field');
    svg.empty();
    for (var i = 0; i < waypoints.length; i++) {
        if (waypoints.length > 1 && i != waypoints.length - 1) {
            path = "M " + waypoints[i].pose.x + " " + waypoints[i].pose.y
            for (var t = 0; t < 1; t += 0.05) {
                var point = interpolatePoint(t, waypoints[i].pose, waypoints[i + 1].pose);
                path += " L " + Math.round(point.x) + " " + Math.round(point.y) + " ";
            }
            path += " L " + waypoints[i + 1].pose.x + " " + waypoints[i + 1].pose.y;

            var newPath = $(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
            $(newPath).attr({
                d: path,
                stroke: "#2CFF2C",
                fill: "transparent",
                "stroke-width": "3",
            });
            newPath.appendTo(svg);
        }
        var newCircle = $(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));

        $(newCircle).attr({
            cx: Math.round(waypoints[i].pose.x),
            cy: Math.round(waypoints[i].pose.y),
            r: "5",
            fill: "#FF3355",
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
        prev = new Pose(50, 50, 0);
    }
    appendTable(prev.x + 20, prev.y + 20);
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
    var title = $('#title').val();
    if (!title) {
        window.alert("Please set the title");
        return;
    }
    var jsonPoses = JSON.stringify(waypoints, null, 1);
    download(jsonPoses, title + ".json", 'text/plain');
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
    $('input').bind("change paste keyup", function () {
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
        "<td><button onclick='$(this).parent().parent().remove();update()'>Delete</button></td></tr>"
    );
}