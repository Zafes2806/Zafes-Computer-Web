const bufferModule = require('buffer');

// Older JWT/OAuth dependencies still expect `buffer.SlowBuffer`.
// Node 25 removed that export, so we alias it to `Buffer` for compatibility.
if (!bufferModule.SlowBuffer) {
    bufferModule.SlowBuffer = bufferModule.Buffer;
}

module.exports = bufferModule;
