let fs = require('fs');
let zlib = require('zlib');
let crypto = require('crypto');


function geFileList(path) {
    let filesList = [];
    readFile(path, filesList);
    return filesList;
}

function readFile(path, filesList) {
    files = fs.readdirSync(path);
    files.forEach(walk);
    function walk(file) {
        states = fs.statSync(path + '/' + file);
        if (states.isDirectory()) {
            readFile(path + '/' + file, filesList);
        }
        else {
            let obj = new Object();
            obj.size = states.size;
            obj.name = file;
            obj.path = path + '/' + file;
            filesList.push(obj);
        }
    }
}

let getFileName = function (path) {
    let pathList = path.split("/");
    let fileName = pathList[pathList.length - 1];
    return fileName;
};


let getFileContent = function (filePath, cb) {
    fs.readFile(filePath, function (err, buf) {
        cb(err, buf);
    });
};

let writeFileSync = function (filePath, text) {
    fs.writeFileSync(filePath, text);
};

let writeFileAsync = function (filePath, text, cb) {
    fs.writeFile(filePath, text, function (err) {
        cb(err);
    });
};


/********************Encrypt/Decrypt**************************/

let egAlgos = ['aes-128-cbc', 'aes-192-cbc',]; //On recent OpenSSL releases, `openssl list -cipher-algorithms` will display the available cipher algorithms.

let configs = {
    algorithm: 'aes-128-cbc',
    cryptkey: '123456', //default key
    iv: "123456" //default iv
};

function util() { }
let prot = util.prototype;

prot.setKey = function (keyStr) {
    let _keyStr = keyStr;
    if (_keyStr == undefined || _keyStr == null || _keyStr == '' || _keyStr.length == 0) {
        _keyStr = configs.cryptkey
        console.log("The key is set to default one, which is " + configs.cryptkey);
    }
    let md5Val = prot.md5(_keyStr);
    let high16 = md5Val.substring(0, 16)
    // configs.cryptkey = crypto.enc.Utf8.parse(high16);
    configs.cryptkey = high16;
    // console.log("key is: " + configs.cryptkey);
}

prot.setIV = function (ivStr) {
    let _ivStr = ivStr;
    if (_ivStr == undefined || _ivStr == null || _ivStr == '' || _ivStr.length == 0) {
        _ivStr = configs.iv
        console.log("Initial vector is set to default one, which is " + configs.iv);
    }
    let md5Val = prot.md5(_ivStr);
    let high16 = md5Val.substring(0, 16);
    // configs.iv = crypto.enc.Utf8.parse(high16);
    configs.iv = high16;
    // console.log("initial vector is: " + configs.iv);
}


prot.setAlgo = function (algorithm) {
    if (algorithm == null || algorithm == '' || algorithm.length == 0) {
        console.log("Algorithm is set to default one, which is " + configs.algorithm);
    } else {
        configs.algorithm = algorithm;
    }
}

prot.md5 = function (str) {
    let md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
};

prot.encode = function (content) {
    let cipher = crypto.createCipheriv(configs.algorithm, configs.cryptkey, configs.iv);
    cipher.setAutoPadding(true);
    let bf = [];
    bf.push(cipher.update(content));
    bf.push(cipher.final());
    return Buffer.concat(bf);
};


prot.decode = function (content) {
    let decipher = crypto.createDecipheriv(configs.algorithm, configs.cryptkey, configs.iv);
    decipher.setAutoPadding(true);
    try {
        let a = [];
        a.push(decipher.update(content));
        a.push(decipher.final());
        return Buffer.concat(a);
    } catch (e) {
        console.error('decode error:', e.message);
        return null;
    }
};


/**********************zip/unzip************************/
function gZip(strText, cb) {
    zlib.gzip(strText, function (err, bufData) {
        cb(err, bufData);
    });
}

function unZip(buffer, cb) {
    zlib.unzip(buffer, function (err, buf) {
        cb(err, buf);
    });
}


module.exports = {
    "FileUtil": {
        "getDirFiles": geFileList,
        "getFileName": getFileName,
        "writeFileAsync": writeFileAsync,
        "writeFileSync": writeFileSync,
        "getFileContent": getFileContent
    },
    "CryptUtil": util,
    "ZipUtil": {
        "gZip": gZip,
        "unZip": unZip
    }
};