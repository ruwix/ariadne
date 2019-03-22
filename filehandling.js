
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
            $("#poseInput").empty();
            var title = fr.fileName.split('.').slice(0, -1).join('.')
            $("#title").val(title);
            parse.forEach((pose) => {
                appendTable(pose[0], pose[1], pose[2]);
            });
            update();
        }
        fr.readAsText(file);
    });
}

function objectToCSV(data) {
    var columnDelimiter = ",";
    var lineDelimiter = "\n"

    var keys = Object.keys(data[0]);

    var result = ""
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

