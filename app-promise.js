const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const oracledb = require('oracledb');
const XLSX = require('xlsx');
const _ = require('lodash');

var LookUpType = require('./models/LookUpType');
var LookUpValue = require('./models/LookUpValue');

var app = express();

var port = process.env.PORT || 3000;

var filePath = './Lookup.sql';

var uploadedFile = '';

app.use(express.static(__dirname + '/public'));

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

app.post('/', (request, response) => {
    var form = new formidable.IncomingForm();

    form.parse(request, (err, fields, files) => {
        try {
            var f = files[Object.keys(files)[0]];
            var workbook = XLSX.readFile(f.path);

            var result = {};
            var LOOK_UP_TYPE_SHEET = "Lookup Types";

            result = to_json(LOOK_UP_TYPE_SHEET);

            var LOOK_UP_VALUE_SHEET = "Lookup Values";

            result = to_json(LOOK_UP_VALUE_SHEET);

            var username = _.isEmpty(fields.username) ? "fusion" : fields.username;
            var password = _.isEmpty(fields.password) ? "fusion" : fields.password;
            var hostname = _.isEmpty(fields.hostname) ? "slcak358.us.oracle.com" : fields.hostname;
            var sid = _.isEmpty(fields.sid) ? "ems2658" : fields.sid;
            debugger;

            var connectionPromise = oracledb.getConnection({
                user: username,
                password: password,
                connectString: `${hostname}/${sid}`
            });




            fs.writeFileSync(filePath, '');

            result[LOOK_UP_TYPE_SHEET].forEach((element) => {
                var LOOK_UP_TYPE = LookUpType.LOOK_UP_TYPE;
                var lookUpType = element[LOOK_UP_TYPE];
                var lookupTypeStatus = element[LookUpType.LOOK_UP_TYPE_STATUS];
                if (lookUpType && lookupTypeStatus.toLowerCase() === 'new') {
                    var custLevel = level(element[LookUpType.CUSTOMIZATION_LEVEL]);
                    var lookUpTypeMeaning = element[LookUpType.LOOK_UP_TYPE_MEANING];
                    var lookUpTypeDescription = element[LookUpType.LOOK_UP_TYPE_DESCRIPTION];

                    connectionPromise.then((connection) => {
                        return connection.execute(`select VIEW_APPLICATION_ID,MODULE_ID from FND_LOOKUP_TYPES where LOOKUP_TYPE = :id`, [lookUpType], {
                            outFormat: oracledb.ARRAY
                        });
                    }).then((resolve) => {
                        ids = resolve.rows[0];
                        console.log(ids);
                        var applicationID = ids[0];
                        var moduleID = ids[1];
                        console.log(lookUpType);
                        fs.appendFileSync(filePath,
                            `INSERT INTO FND_LOOKUP_TYPES VALUES('${lookUpType}',${applicationID},NULL,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,${moduleID},1,${custLevel},1,'N','SDF_FILE');\n`);
                        fs.appendFileSync(filePath,
                            `INSERT INTO FND_LOOKUP_TYPES_TL VALUES('${lookUpType}',${applicationID},'US','US','Admit Type','${lookUpTypeMeaning}','${lookUpTypeDescription}','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                        // doRelease(connectionPromise.getConnection());
                    },(reject)=>{
                        throw new Error(
                            `Cannot establish the connection,Username:${username},Password:${password},Connection String:${hostname}/${sid} ${reject.message}`);
                    }).catch((reject) => {
                        console.log(reject.message);
                    });

                }
            });

            result[LOOK_UP_VALUE_SHEET].forEach((element) => {
                var LOOK_UP_TYPE = LookUpType.LOOK_UP_TYPE;
                var lookUpType = element[LOOK_UP_TYPE];
                var lookupValueStatus = element[LookUpValue.LOOK_UP_VALUE_STATUS];
                if (lookUpType && lookupValueStatus.toLowerCase() === 'new') {
                    var lookUpValueMeaning = element[LookUpValue.LOOK_UP_VALUE_MEANING];
                    var lookUpValueDescription = element[LookUpValue.LOOK_UP_VALUE_DESCRIPTION];
                    var lookUpValue = `'${element[LookUpValue.LOOK_UP_VALUE]}'`;
                    var displaySequence = element[LookUpValue.DISPLAY_SEQUENCE] || 1;
                    var enabledFlag = `${element[LookUpValue.ENABLED_FLAG]}`;

                    connectionPromise.then((connection) => {
                        return connection.execute(`select VIEW_APPLICATION_ID,MODULE_ID from FND_LOOKUP_TYPES where LOOKUP_TYPE = :id`, [lookUpType], {
                            outFormat: oracledb.ARRAY
                        });
                    }).then((resolve) => {
                        ids = resolve.rows[0];
                        console.log(ids);
                        var applicationID = ids[0];
                        var moduleID = ids[1];
                        fs.appendFileSync(filePath,
                            `INSERT INTO FND_LOOKUP_VALUES_B VALUES('${lookUpType}',${lookUpValue},${applicationID},0,${enabledFlag},NULL,NULL,${displaySequence},'SEED_DATA_FROM_APPLICATION',SYSDATE,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'N','SDF_FILE');\n`);
                        fs.appendFileSync(filePath,
                            `INSERT INTO FND_LOOKUP_VALUES_TL VALUES('${lookUpType}',${lookUpValue},${applicationID},0,'US','${lookUpValueMeaning}','${lookUpValueDescription}','US','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                    },(reject)=>{
                        throw new Error(`Cannot establish the connection ${reject.message}`);
                    }).catch((reject) => {
                        console.log(reject.message);
                    });
                }
            });


            function to_json(sheetName) {
                var workSheet = workbook.Sheets[sheetName];
                var roa = XLSX.utils.sheet_to_row_object_array(workSheet);
                if (roa.length > 0) {
                    result[sheetName] = roa;
                }

                return result;
            }

            function doRelease(connection) {
                connection.release(
                    function (err) {
                        if (err) {
                            console.error(err.message);
                        }
                    }
                );
            }


        } catch (e) {
            response.send(e.message);
            process.exit(4);
        }
    });

    var level = (customizationLevel) => {
        if (customizationLevel === 'Extensible') {
            return 'E';
        } else if (customizationLevel === 'System') {
            return 'S';
        } else if (customizationLevel === 'User') {
            return 'U';
        }
    };



    form.on('fileBegin', function (name, file) {
        file.path = __dirname + '/' + file.name;
        uploadedFile = file.name;
    });

    form.on('file', function (name, file) {
        console.log('Uploaded ' + file.name);
    });


    response.download(filePath);
});

app.listen(3000, '0.0.0.0', function () {
    console.log('Listening to port:  ' + 3000);
});

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });