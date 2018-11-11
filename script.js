var wto;

var Pose = function (x, y, heading) {
    this.x = x || 0;
    this.y = y || 0;
    this.heading = heading || 0;
};
var poses = []

function init() {
    $('input').bind("change paste keyup", function () {
        clearTimeout(wto);
        wto = setTimeout(function () {
            update();
        }, 100);
    });
    addPoint();
    addPoint();

}

function update() {
    poses = [];
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
        poses.push(new Pose(x, y, heading));
    });
    drawPoses();
}

function drawPoses() {
    var svg = $('#field');
    svg.empty();
    for (var i = 0; i < poses.length; i++) {
        if (poses.length > 1 && i != poses.length - 1) {
            path = "M " + poses[i].x + " " + poses[i].y
            for (var t = 0; t < 1; t += 0.05) {
                var point = interpolatePoint(t, poses[i], poses[i + 1]);
                path += " L " + Math.round(point.x) + " " + Math.round(point.y) + " ";
            }
            path += " L " + poses[i + 1].x + " " + poses[i + 1].y;

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
            cx: Math.round(poses[i].x),
            cy: Math.round(poses[i].y),
            r: "5",
            fill: "#FF3355",
        });
        newCircle.appendTo(svg);
    }
}

function addPoint() {
    var prev;
    if (poses.length > 0)

        prev = poses[poses.length - 1];
    else
        prev = new Pose(50, 50, 0);
    $("tbody").append("<tr>" +
        "<td><input type='number' value='" + (prev.x + 20) + "'></td>" +
        "<td><input type='number' value='" + (prev.y + 20) + "'></td>" +
        "<td><input type='number' value='0'></td>" +
        "<td><input type='number' value='60'></td>" +
        "<td class='comments'><input placeholder='Comments'></td>" +
        "<td><button onclick='$(this).parent().parent().remove();update()'>Delete</button></td></tr>"
    );

    update();
    $('input').unbind("change paste keyup");
    $('input').bind("change paste keyup", function () {
        clearTimeout(wto);
        wto = setTimeout(function () {
            update();
        }, 100);
    });
}

