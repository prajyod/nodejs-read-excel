const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const oracledb = require('oracledb');
const XLSX = require('xlsx');

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
                    // var IDs = fetchID(`${lookUpType}`);
                    // var applicationID = IDs[0];
                    // var moduleID = IDs[1];

                    oracledb.getConnection({  
                    user: "fusion",  
                    password: "fusion",  
                    connectString: "indl136033.in.oracle.com:1522/in136033"  
               }, function(err, connection) {  
                    if (err) {  
                         console.error(err.message);  
                         return;  
                    }
                    // console.log(TYPE);
                    //'ORA_HEQ_SOURCE_INTEREST'
                    connection.execute(`select VIEW_APPLICATION_ID,MODULE_ID from FND_LOOKUP_TYPES where LOOKUP_TYPE = :id`,  
                    [lookUpType],  
                    function(err, result) {  
                         if (err) {  
                              console.error(err.message);  
                              doRelease(connection);  
                              return;  
                         }
                        //  console.log(result.metaData);  
                        //  console.log(result.rows.length);  
                         ids = result.rows[0];
                        //  console.log(TYPE);
                         console.log(ids);
                        //  if(ids){
                         var applicationID = ids[0];
                        var moduleID = ids[1];
                        console.log(lookUpType);
                         fs.appendFileSync('./lookup.sql',
                         `INSERT INTO FND_LOOKUP_TYPES VALUES('${lookUpType}',${applicationID},NULL,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,${moduleID},1,${custLevel},1,'N','SDF_FILE');\n`);
                     fs.appendFileSync('./lookup.sql',
                         `INSERT INTO FND_LOOKUP_TYPES_TL VALUES('${lookUpType}',${applicationID},'US','US','Admit Type','${lookUpTypeMeaning}','${lookUpTypeDescription}','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                        // }
                         doRelease(connection);  
                    });  
               });  
                 
               function doRelease(connection) {  
                    connection.release(  
                         function(err) {  
                              if (err) {console.error(err.message);}  
                         }  
                    );  
               }

                    // fs.appendFileSync('./lookup.txt',
                    //     `INSERT INTO FND_LOOKUP_TYPES VALUES('${lookUpType}',${applicationID},NULL,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,${moduleID},1,${custLevel},1,'N','SDF_FILE');\n`);
                    // fs.appendFileSync('./lookup.txt',
                    //     `INSERT INTO FND_LOOKUP_TYPES_TL VALUES('${lookUpType}',${applicationID},'US','US','Admit Type','${lookUpTypeMeaning}','${lookUpTypeDescription}','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
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
                    var enabledFlag = element[LookUpValue.ENABLED_FLAG];
                    // var IDs = fetchID(`${lookUpType}`);
                    // var applicationID = IDs[0];
                    // var moduleID = IDs[1];
                    oracledb.getConnection({  
                        user: "fusion",  
                        password: "fusion",  
                        connectString: "indl136033.in.oracle.com:1522/in136033"  
                   }, function(err, connection) {  
                        if (err) {  
                             console.error(err.message);  
                             return;  
                        }
                        // console.log(TYPE);
                        connection.execute(`select VIEW_APPLICATION_ID,MODULE_ID from FND_LOOKUP_TYPES where LOOKUP_TYPE = :id`,  
                        [lookUpType],  
                        function(err, result) {  
                             if (err) {  
                                  console.error(err.message);  
                                  doRelease(connection);  
                                  return;  
                             }
                            //  console.log(result.metaData);  
                            //  console.log(result.rows.length);  
                             ids = result.rows[0];
                            //  if(ids){
                            //  console.log(TYPE);
                             console.log(ids);
                             var applicationID = ids[0];
                            var moduleID = ids[1];
                            fs.appendFileSync('./lookup.sql',
                                `INSERT INTO FND_LOOKUP_VALUES_B VALUES('${lookUpType}',${lookUpValue},${applicationID},0,${enabledFlag},NULL,NULL,${displaySequence},'SEED_DATA_FROM_APPLICATION',SYSDATE,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'N','SDF_FILE');\n`);
                            fs.appendFileSync('./lookup.sql',
                                `INSERT INTO FND_LOOKUP_VALUES_TL VALUES('${lookUpType}',${lookUpValue},${applicationID},0,'US','${lookUpValueMeaning}','${lookUpValueDescription}','US','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                            // }
                             doRelease(connection);  
                        });  
                   });  
                     
                   function doRelease(connection) {  
                        connection.release(  
                             function(err) {  
                                  if (err) {console.error(err.message);}  
                             }  
                        );  
                   }

                    // fs.appendFileSync('./lookup.txt',
                    //     `INSERT INTO FND_LOOKUP_VALUES_B VALUES('${lookUpType}','${lookUpValue}',${applicationID},0,${enabledFlag},NULL,NULL,${displaySequence},'SEED_DATA_FROM_APPLICATION',SYSDATE,'SEED_DATA_FROM_APPLICATION',SYSDATE,-1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'N','SDF_FILE');\n`);
                    // fs.appendFileSync('./lookup.txt',
                    //     `INSERT INTO FND_LOOKUP_VALUES_TL VALUES('${lookUpType}','${lookUpValue}',${applicationID},0,'US','${lookUpValueMeaning}','${lookUpValueDescription}','US','SEED_DATA_FROM_APPLICATION',sysdate,'SEED_DATA_FROM_APPLICATION',sysdate,-1,1,1,'N','SDF_FILE');\n\n`);
                }
            });

        //     var connectionPromise = oracledb.getConnection({  
        //         user: "fusion",  
        //         password: "fusion",  
        //         connectString: "indl136033.in.oracle.com:1522/in136033"  
        //    });

        //    connectionPromise.then((resolve,reject)=>{
        //     connectionPromise.execute(`select VIEW_APPLICATION_ID,MODULE_ID from FND_LOOKUP_TYPES where LOOKUP_TYPE = :id`,  
        //     [TYPE],  
        //     function(err, result) {  
        //          if (err) {  
        //               console.error(err.message);  
        //               doRelease(connection);  
        //               return;  
        //          }
        //         //  console.log(result.metaData);  
        //         //  console.log(result.rows.length);  
        //          ids = result.rows[0];
        //          console.log(TYPE);
        //          console.log(ids);
        //          doRelease(connection);  
        //     });
        //    });

            // fetchID('ORA_HEQ_ADMIT_TYPE');
            function fetchID(TYPE){
                var ids=[];
                oracledb.getConnection({  
                    user: "fusion",  
                    password: "fusion",  
                    connectString: "indl136033.in.oracle.com:1522/in136033"  
               }, function(err, connection) {  
                    if (err) {  
                         console.error(err.message);  
                         return;  
                    }
                    // console.log(TYPE);
                    connection.execute(`select VIEW_APPLICATION_ID,MODULE_ID from FND_LOOKUP_TYPES where LOOKUP_TYPE = :id`,  
                    [TYPE],  
                    function(err, result) {  
                         if (err) {  
                              console.error(err.message);  
                              doRelease(connection);  
                              return;  
                         }
                        //  console.log(result.metaData);  
                        //  console.log(result.rows.length);  
                         ids = result.rows[0];
                         console.log(TYPE);
                         console.log(ids);
                         doRelease(connection);  
                    });  
               });  
                 
               function doRelease(connection) {  
                    connection.release(  
                         function(err) {  
                              if (err) {console.error(err.message);}  
                         }  
                    );  
               }
               return ids;
            }
           


            function to_json(sheetName) {
                var workSheet = workbook.Sheets[sheetName];
                var roa = XLSX.utils.sheet_to_row_object_array(workSheet);
                if (roa.length > 0) {
                    result[sheetName] = roa;
                }

                return result;
            }

            function getID(){

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
    });

    form.on('file', function (name, file) {
        console.log('Uploaded ' + file.name);
    });

    response.sendFile(__dirname + '/index.html');
    // response.send('./uploads/lookup.txt')
});

app.listen(3000, '0.0.0.0', function() {
    console.log('Listening to port:  ' + 3000);
});

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });