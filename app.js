const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');
const formidable = require('formidable');

var LookUpType = require('./models/LookUpType');
var LookUpValue = require('./models/LookUpValue');

var app = express();

var port = process.env.PORT || 3000;


app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

app.post('/', (request, response) => {
    var form = new formidable.IncomingForm();

    form.parse(request, (err, fields, files) => {
        try {
            var f = files[Object.keys(files)[0]];
            var workbook = XLSX.readFile(f.path);
            // fs.writeFileSync('./uploads/workbook.txt', JSON.stringify(workbook, undefined, 2));


            var target_sheet = "Lookup Types";

            var worksheet = workbook.Sheets[target_sheet];
            var data = [];
            if (worksheet) {
                var headers = {};

                for (z in worksheet) {
                    var tt = 0;
                    for (var i = 0; i < z.length; i++) {
                        if (!isNaN(z[i])) {
                            tt = i;
                            break;
                        }
                    };
                    var col = z.substring(0, tt);
                    var row = parseInt(z.substring(tt));
                    var value = worksheet[z].v;

                    if (row == 1 && value) {
                        headers[col] = value;
                        continue;
                    }

                    if (!data[row]) {
                        data[row] = {};
                    }
                    data[row][headers[col]] = value;

                }
                data.shift();
                data.shift();

                console.log(data);
                console.log(XLSX.utils.sheet_to_json(worksheet));

                fs.writeFileSync('./lookup.txt', '');
                for (var i = 0; i < data.length; i++) {
                    var LOOK_UP_TYPE = LookUpType.LOOK_UP_TYPE;
                    var lookUpType = data[i][LOOK_UP_TYPE];
                    if (lookUpType) {
                        var custLevel = level(data[i][LookUpType.CUSTOMIZATION_LEVEL]);
                        var lookUpTypeMeaning = data[i][LookUpType.LOOK_UP_TYPE_MEANING];
                        var lookUpTypeDescription = data[i][LookUpType.LOOK_UP_TYPE_DESCRIPTION];

                        fs.appendFileSync('./lookup.txt',
                            `INSERT INTO FND_LOOKUP_TYPES VALUES('${lookUpType}',1059,NULL,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,'MODULE_ID',1,${custLevel},1,'N','SDF_FILE');\n`);
                        fs.appendFileSync('./lookup.txt',
                            `INSERT INTO FND_LOOKUP_TYPES_TL VALUES('${lookUpType}',1059,'US','US','Admit Type','${lookUpTypeMeaning}','${lookUpTypeDescription}','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                    }
                }
            }
            target_sheet  = "Lookup Values";
            worksheet = workbook.Sheets[target_sheet];
            data = [];
            if (worksheet) {
                var headers = {};

                for (z in worksheet) {
                    var tt = 0;
                    for (var i = 0; i < z.length; i++) {
                        if (!isNaN(z[i])) {
                            tt = i;
                            break;
                        }
                    };
                    var col = z.substring(0, tt);
                    var row = parseInt(z.substring(tt));
                    var value = worksheet[z].v;

                    if (row == 1 && value) {
                        headers[col] = value;
                        continue;
                    }

                    if (!data[row]) {
                        data[row] = {};
                    }
                    data[row][headers[col]] = value;

                }
                data.shift();
                data.shift();

                console.log(data);

                // fs.writeFileSync('./uploads/lookup.txt', '');
                for (var i = 0; i < data.length; i++) {
                    var LOOK_UP_TYPE = LookUpType.LOOK_UP_TYPE;
                    var lookUpType = data[i][LOOK_UP_TYPE];
                    if (lookUpType) {
                        var lookUpValueMeaning = data[i][LookUpValue.LOOK_UP_VALUE_MEANING];
                        var lookUpValueDescription = data[i][LookUpType.LOOK_UP_VALUE_DESCRIPTION];
                        var lookUpValue = data[i][LookUpValue.LOOK_UP_VALUE];

                        fs.appendFileSync('./lookup.txt',
                            `INSERT INTO FND_LOOKUP_VALUES_B VALUES('${lookUpType}','${lookUpValue}',10549,0,'Y',NULL,NULL,0,'SEED_DATA_FROM_APPLICATION',SYSDATE,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'N','SDF_FILE');\n`);
                        fs.appendFileSync('./lookup.txt',
                            `INSERT INTO FND_LOOKUP_VALUES_TL VALUES('${lookUpType}','${lookUpValue}',10549,0,'US','${lookUpValueMeaning}','${lookUpValueDescription}','US','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                    }
                }
            }


        } catch (e) {
            // console.error(": error parsing " + f.name + " " + target_sheet + ": " + e);
            response.send(e.message);
            process.exit(4);
        }
    });

    var level = (customizationLevel) => {
        if (customizationLevel === 'Extensible') {
            return 'E'
        } else if (customizationLevel === 'System') {
            return 'S'
        } else if (customizationLevel === 'User') {
            return 'U'
        }
    };



    form.on('fileBegin', function (name, file) {
        file.path = __dirname + '/' + file.name;
    });

    form.on('file', function (name, file) {
        console.log('Uploaded ' + file.name);
    });

    response.sendFile(__dirname + '/index.html');
    // response.send('./uploads/lookup.txt')
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});