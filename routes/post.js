var async = require('async');
var MAX_WORKER = 5;
var queue = async.queue(postQ, MAX_WORKER);
var fs = require('fs');
var csv = require("csvtojson");
var Promise = require("bluebird");
var rp = require('request-promise');
var path = require('path');

// Status Codes
var STATUS_OK = 200;
var SERVER_ERROR = 500;
var NOT_FOUND = 404;
var BAD_REQUEST = 400;

/**
 *
 * @param app
 */
module.exports = function apiHandler(app){

    app.post('/convert',function post_dispatcher(req, res){
        if(req.body === null || req.body === undefined){
            res.status(BAD_REQUEST).json({"Error": "JSON passed is incorrect"});
        }
        var inputFileName = req.body.input;
        var outputFileName = req.body.output;

        if(inputFileName === null || outputFileName === null){
            res.status(BAD_REQUEST).json({"Error": "JSON passed is incorrect as either input " +
                "or output filename is missing"});
        }

        var inputPath = path.resolve("./data/"+inputFileName);
        var outputPath = path.resolve("./data/"+outputFileName);

        checkPaths(inputPath, outputPath,function(err){
            if(err){
                console.error(err);
                res.status(NOT_FOUND).json({"Error": "Incorrect filename in JSON"});
            } else {
                console.info("Queueing the create request");
                queue.push({
                    taskType:'convertJob',
                    inputFile: inputPath,
                    outputFile:outputPath
                })

                res.sendStatus(STATUS_OK);
            }
        })

    })

    app.post('/jobs/:jobId/tasks',function post_dispatcher(req, res){
        if(req.body === null || req.body === undefined){
            res.status(BAD_REQUEST).json({"Error": "JSON passed is incorrect"});
        }
        var taskId = req.body.name;
        var tags = req.body.tags;
        var jobId = req.params.jobId;
        var baseUrl = "https://cfassignment.herokuapp.com/";

        // create request objects
        var requests = [
            {
                method: 'POST',
                url: baseUrl+"tasks",
                body: {
                    name: taskId
                },
                json: true
            },
            {
                method: 'POST',
                url: baseUrl+"tasks/"+taskId+"/"+"tags",
                body: {
                    tags: tags
                },
                json: true
            },
            {
                method: 'POST',
                url: baseUrl+"jobs/"+jobId+"/"+"tasks",
                body: {
                    taskId: taskId
                },
                json: true
            }
        ];

        Promise.map(requests, function(request) {
            console.log("Sending request "+JSON.stringify(request));
            return rp(request)
                .then(function(body) {
                    console.log(body);
                })
                .catch(function (err){
                    console.error(err.message);
                    throw err;
                })
        }).then(function(results) {
                console.log(results);
                res.sendStatus(STATUS_OK);
            })
            .catch(function(error){
                res.status(BAD_REQUEST).json({"Error": error.error});

            })


    })
}

function postQ(task){
    var rows = [];
    console.log("reading from "+task.inputFile)
    var readStream = fs.createReadStream(task.inputFile);

    console.log("Writing to "+task.outputFile);
    var writeStream = fs.createWriteStream(task.outputFile);

    readStream.pipe(csv({constructResult:false, toArrayString:true})).pipe(writeStream);
}

function checkPaths(input, output,cb){
    async.series([
        function(callback){
            fs.stat(input, function(err, stats) {
                if(err){
                    return callback(err);
                } else {
                    return callback(null);
                }
            })
        },
        function(callback){
            fs.stat(output, function(err, stats) {
                if(err){
                    return callback(err);
                } else {
                    return callback(null);
                }
            })
        }
        ],
    function(err){
        if(err){
            return cb(err);
        } else {
            return cb(null);
        }
    })
}