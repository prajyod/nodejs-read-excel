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

            var result = {};
            var LOOK_UP_TYPE_SHEET = "Lookup Types";

            result = to_json(LOOK_UP_TYPE_SHEET);

            var LOOK_UP_VALUE_SHEET = "Lookup Values";

            result = to_json(LOOK_UP_VALUE_SHEET);

            var applicationIDMap = {};
            var moduleIDMap = {};

            result[LOOK_UP_TYPE_SHEET].forEach((element) => {
                var LOOK_UP_TYPE = LookUpType.LOOK_UP_TYPE;
                var lookUpType = element[LOOK_UP_TYPE];
                var lookupTypeStatus = element[LookUpType.LOOK_UP_TYPE_STATUS];
                if (lookUpType && lookupTypeStatus.toLowerCase() === 'new') {
                    var custLevel = level(element[LookUpType.CUSTOMIZATION_LEVEL]);
                    var lookUpTypeMeaning = element[LookUpType.LOOK_UP_TYPE_MEANING];
                    var lookUpTypeDescription = element[LookUpType.LOOK_UP_TYPE_DESCRIPTION];
                    

                    fs.appendFileSync('./lookup.txt',
                        `INSERT INTO FND_LOOKUP_TYPES VALUES('${lookUpType}',1059,NULL,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,'MODULE_ID',1,${custLevel},1,'N','SDF_FILE');\n`);
                    fs.appendFileSync('./lookup.txt',
                        `INSERT INTO FND_LOOKUP_TYPES_TL VALUES('${lookUpType}',1059,'US','US','Admit Type','${lookUpTypeMeaning}','${lookUpTypeDescription}','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                }
            });

            result[LOOK_UP_VALUE_SHEET].forEach((element) => {
                var LOOK_UP_TYPE = LookUpType.LOOK_UP_TYPE;
                var lookUpType = element[LOOK_UP_TYPE];
                var lookupValueStatus = element[LookUpValue.LOOK_UP_VALUE_STATUS];
                if (lookUpType && lookupValueStatus.toLowerCase() === 'new') {
                    var lookUpValueMeaning = element[LookUpValue.LOOK_UP_VALUE_MEANING];
                    var lookUpValueDescription = element[LookUpType.LOOK_UP_VALUE_DESCRIPTION];
                    var lookUpValue = element[LookUpValue.LOOK_UP_VALUE];
                    var displaySequence = element[LookUpValue.DISPLAY_SEQUENCE];
                    var enabledFlag = element[LookUpValue.ENABLED_FLAG];

                    fs.appendFileSync('./lookup.txt',
                        `INSERT INTO FND_LOOKUP_VALUES_B VALUES('${lookUpType}','${lookUpValue}',10549,0,${enabledFlag},NULL,NULL,${displaySequence},'SEED_DATA_FROM_APPLICATION',SYSDATE,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'N','SDF_FILE');\n`);
                    fs.appendFileSync('./lookup.txt',
                        `INSERT INTO FND_LOOKUP_VALUES_TL VALUES('${lookUpType}','${lookUpValue}',10549,0,'US','${lookUpValueMeaning}','${lookUpValueDescription}','US','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                }
            });


            function to_json(sheetName) {
                var workSheet = workbook.Sheets[sheetName];
                // workbook.SheetNames.forEach(function (sh) {
                //     if (sh === sheetName) {
                var roa = XLSX.utils.sheet_to_row_object_array(workSheet);
                if (roa.length > 0) {
                    result[sheetName] = roa;
                }
                //     }
                // });

                return result;
            }

            function getID(){

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