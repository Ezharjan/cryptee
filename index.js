#!/usr/bin/env node

const fs = require('fs');
let utils = require('./utils');
let async = require('async');
let cryptUtil = new utils.CryptUtil();
let packageData = require('./package.json')

function showNilResponse() {
    console.log("Sorry, please use -h for help!")
}
function showHelpInfo() {
    let infoText = `
-v: view the version info
-h: view the help info
-e: encrypt the relevant file
-d: decrypt the relevant file
-re: recursively encrypt files in the relevant folder
-de: recursively decrypt files in the relevant folder

* Args should be used like the examples shown below: 
* 1. cmd  2. source-path  3. output-path 4. key  5. iv  6. algo
* The 4th, 5th, 6th arg can be ignored while 1 to 3 shall not.
* The absolute path is need for 2n and 3rd arg.
* eg: 
* cryptee -e D:/myFile.mp4 D:/output.encrypted [THIS_IS_THE_KEY] [THIS_IS_THE_IV] [THIS_IS_THE_ALGO]  
* cryptee -d D:/output.encrypted D:/myFile.mp4 [THIS_IS_THE_KEY] [THIS_IS_THE_IV] [THIS_IS_THE_ALGO]  
* cryptee -re D:/output D:/myFolder [THIS_IS_THE_KEY] [THIS_IS_THE_IV] [THIS_IS_THE_ALGO]  
* cryptee -rd D:/output D:/myFolder [THIS_IS_THE_KEY] [THIS_IS_THE_IV] [THIS_IS_THE_ALGO]  
`;
    console.log(infoText);
}


function InitValues(args) {
    cryptUtil.setKey(args[3]);
    cryptUtil.setIV(args[4]);
    cryptUtil.setAlgo(args[5]);
}
function RespondToArgs() {
    const args = process.argv.slice(2);
    if (args.length <= 1) {
        switch (args[0]) {
            case '-v':
                console.log(`Current version is ${packageData.version}, by Alexander Ezharjan(${packageData.email}).`);
                break;
            case '-h':
                showHelpInfo();
                break;
            case '-e':
            case '-re':
            case '-d':
            case '-rd':
                console.log("Invalid single arg! Please input the whole args!")
                break;
            case '':
            case '.':
            default:
                showNilResponse();
                break;
        }
    } else {
        if ((args[1] != undefined || args[1] != null || args[1] != '')
            && args[2] != undefined || args[2] != null || args[2] != '') {
            switch (args[0]) {
                case '-e':
                    InitValues(args);
                    zipNdEncrypt(args[1], args[2]);
                    break;
                case '-re':
                    InitValues(args);
                    zipNdEncryptRecursively(args[1], args[2]);
                    break;
                case '-d':
                    InitValues(args);
                    decryptNdUnzip(args[1], args[2]);
                    break;
                case '-rd':
                    InitValues(args);
                    decryptNdUnzipRecursively(args[1], args[2]);
                    break;
                default:
                    showNilResponse();
                    break;
            }
        } else {
            console.warn('Invalid path!');
        }
    }
}

function CreateOutputPath(outputFilePath) {
    let _outputFilePath = outputFilePath.replace(/\//g, '\\');
    let outputDirectoryArr = _outputFilePath.split('\\');
    let outputDir = "";
    if (outputDirectoryArr.length <= 1) {
        outputDir = _outputFilePath;
    } else {
        for (let i = 0; i < outputDirectoryArr.length - 1; i++) {
            if (i == 0 && outputDirectoryArr[i] == ".") {
            } else {
                outputDir += outputDirectoryArr[i];
            }
        }
    }
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
            console.log("Directory is created.");
        } else {
            console.log("Directory already exists.");
        }
    } catch (err) {
        console.log(err);
    }
}

function zipNdEncrypt(inputFilePath, outputFilePath) {
    CreateOutputPath(outputFilePath);
    utils.FileUtil.getFileContent(inputFilePath, function (err, buf) {
        if (!err) {
            let bf = new Buffer.from(buf);
            utils.ZipUtil.gZip(bf, function (err, bufData) {
                let encodeBuffer = cryptUtil.encode(bufData);
                utils.FileUtil.writeFileSync(outputFilePath, encodeBuffer);
                if (!err) {
                    console.log("Encryption succeed!");
                } else {
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }
    });
}


function decryptNdUnzip(inputFilePath, outputFilePath) {
    CreateOutputPath(outputFilePath);
    utils.FileUtil.getFileContent(inputFilePath, function (err, buf) {
        if (!err) {
            let bf = new Buffer.from(buf);
            let decodeBuffer = cryptUtil.decode(bf);
            utils.ZipUtil.unZip(decodeBuffer, function (err, bufData) {
                // console.log(JSON.parse(bufData.toString())); //decrypting
                utils.FileUtil.writeFileSync(outputFilePath, bufData);
                if (!err) {
                    console.log("Decryption succeed!");
                } else {
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }
    });
}


function zipNdEncryptRecursively(inputFileDir, outputFileDir) {
    let fileList = utils.FileUtil.getDirFiles(inputFileDir);
    try {
        if (!fs.existsSync(outputFileDir)) {
            fs.mkdirSync(outputFileDir);
            console.log("Directory is created.");
        } else {
            console.log("Directory already exists.");
        }
    } catch (err) {
        console.log(err);
    }
    async.each(fileList, function (item, callback) {
        let filepath = item.path;
        let filename = utils.FileUtil.getFileName(filepath);
        utils.FileUtil.getFileContent(filepath, function (err, buf) {
            if (!err) {
                let bf = new Buffer.from(buf);
                utils.ZipUtil.gZip(bf, function (err, bufData) {
                    let encodeBuffer = cryptUtil.encode(bufData);
                    let resultPath = outputFileDir + "/" + filename;
                    console.log("eee" + resultPath)
                    utils.FileUtil.writeFileSync(resultPath, encodeBuffer);
                    callback(err);
                });
            } else {
                callback(err);
            }
        });
    }, function (err, resp) {
        if (err) {
            console.log("err :", err);
        } else {
            console.log("Encryption succeed!");
        }
    });
}

function decryptNdUnzipRecursively(inputFileDir, outputFileDir) {
    let fileList = utils.FileUtil.getDirFiles(inputFileDir);
    try {
        if (!fs.existsSync(outputFileDir)) {
            fs.mkdirSync(outputFileDir);
            console.log("Directory is created.");
        } else {
            console.log("Directory already exists.");
        }
    } catch (err) {
        console.log(err);
    }
    async.each(fileList, function (item, callback) {
        let filepath = item.path;
        let filename = utils.FileUtil.getFileName(filepath);
        utils.FileUtil.getFileContent(filepath, function (err, buf) {
            if (!err) {
                let bf = new Buffer.from(buf);
                let decodeBuffer = cryptUtil.decode(bf);
                utils.ZipUtil.unZip(decodeBuffer, function (err, bufData) {
                    // console.log(JSON.parse(bufData.toString())); //decrypting
                    let resultPath = outputFileDir + "/" + filename;
                    utils.FileUtil.writeFileSync(resultPath, bufData);
                    callback(err);
                });
            } else {
                callback(err);
            }
        });
    }, function (err, resp) {
        if (err) {
            console.log("err :", err);
        } else {
            console.log("Decryption succeed!");
        }
    });
}


/*******************************Utilization********************************* */
RespondToArgs();

