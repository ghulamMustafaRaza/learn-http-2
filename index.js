const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const options = {
 key: fs.readFileSync(path.join(__dirname + '/localhost.key'), 'utf8'),
 cert: fs.readFileSync(path.join(__dirname + '/localhost.crt'), 'utf8')
};
const {
    HTTP2_HEADER_PATH,
    HTTP2_HEADER_METHOD,
    HTTP_STATUS_NOT_FOUND,
    HTTP_STATUS_INTERNAL_SERVER_ERROR
} = http2.constants;

// https is necessary otherwise browsers will not
// be able to connect
const server = http2.createSecureServer(options);
const serverRoot = "./";

server.on('stream', (stream, headers) => {
    const reqPath = headers[HTTP2_HEADER_PATH];
    const reqMethod = headers[HTTP2_HEADER_METHOD];

    const fullPath = path.join(serverRoot, reqPath);
    const responseMimeType = mime.lookup(fullPath);

    stream.respondWithFile(fullPath, {
        'content-type': responseMimeType
    }, {
        onError: (err) => respondToStreamError(err, stream)
    });


});

function respondToStreamError(err, stream) {
    console.log(err);
    if (err.code === 'ENOENT') {
        stream.respond({ ":status": HTTP_STATUS_NOT_FOUND });
    } else {
        stream.respond({ ":status": HTTP_STATUS_INTERNAL_SERVER_ERROR });
    }
    stream.end();
}

server.listen(8000);