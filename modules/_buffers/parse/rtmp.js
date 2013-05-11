/*global Buffer*/
// Named constants with unique integer values
var C = {};
// Tokens
var LEFT_BRACE    = C.LEFT_BRACE    = 0x1;
var RIGHT_BRACE   = C.RIGHT_BRACE   = 0x2;
var LEFT_BRACKET  = C.LEFT_BRACKET  = 0x3;
var RIGHT_BRACKET = C.RIGHT_BRACKET = 0x4;
var COLON         = C.COLON         = 0x5;
var COMMA         = C.COMMA         = 0x6;
var TRUE          = C.TRUE          = 0x7;
var FALSE         = C.FALSE         = 0x8;
var NULL          = C.NULL          = 0x9;
var STRING        = C.STRING        = 0xa;
var NUMBER        = C.NUMBER        = 0xb;
// Tokenizer States
var START   = C.START   = 0x11;
var TRUE1   = C.TRUE1   = 0x21;
var TRUE2   = C.TRUE2   = 0x22;
var TRUE3   = C.TRUE3   = 0x23;
var FALSE1  = C.FALSE1  = 0x31;
var FALSE2  = C.FALSE2  = 0x32;
var FALSE3  = C.FALSE3  = 0x33;
var FALSE4  = C.FALSE4  = 0x34;
var NULL1   = C.NULL1   = 0x41;
var NULL2   = C.NULL3   = 0x42;
var NULL3   = C.NULL2   = 0x43;
var NUMBER1 = C.NUMBER1 = 0x51;
var NUMBER2 = C.NUMBER2 = 0x52;
var NUMBER3 = C.NUMBER3 = 0x53;
var NUMBER4 = C.NUMBER4 = 0x54;
var NUMBER5 = C.NUMBER5 = 0x55;
var NUMBER6 = C.NUMBER6 = 0x56;
var NUMBER7 = C.NUMBER7 = 0x57;
var NUMBER8 = C.NUMBER8 = 0x58;
var STRING1 = C.STRING1 = 0x61;
var STRING2 = C.STRING2 = 0x62;
var STRING3 = C.STRING3 = 0x63;
var STRING4 = C.STRING4 = 0x64;
var STRING5 = C.STRING5 = 0x65;
var STRING6 = C.STRING6 = 0x66;
// Parser States
var VALUE   = C.VALUE   = 0x71;
var KEY     = C.KEY     = 0x72;
// Parser Modes
var OBJECT  = C.OBJECT  = 0x81;
var ARRAY   = C.ARRAY   = 0x82;

function toknam(code) {
    var keys = Object.keys(C);
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        if (C[key] === code) {
            return key;
        }
    }
    return code && "0x" + code.toString(16);
}

function Parser() {
    this.tState     = START;
    this.value      = undefined;
    this.string     = undefined;
    this.unicode    = undefined;
    this.negative   = undefined;
    this.magnatude  = undefined;
    this.position   = undefined;
    this.exponent   = undefined;
    this.key        = undefined;
    this.mode       = undefined;
    this.stack      = [];
    this.negativeExponent = undefined;
    this.state = VALUE;
}

var proto = Parser.prototype;

proto.charError = function(buffer, i) {
    this.onError(new Error("Unexpected " + JSON.stringify(String.fromCharCode(buffer[i])) + " at position " + i + " in state " + toknam(this.tState)));
};

proto.onError = function(err) {
    throw err;
};

proto.write = function(buffer) {
    var n;
    for (var i = 0, l = buffer.length; i < l; i++) {
        switch (this.tState) {
          case START:
            n = buffer[i];
            switch (n) {
              case 123:
                this.onToken(LEFT_BRACE, "{");
                break;

              case 125:
                this.onToken(RIGHT_BRACE, "}");
                break;

              case 91:
                this.onToken(LEFT_BRACKET, "[");
                break;

              case 93:
                this.onToken(RIGHT_BRACKET, "]");
                break;

              case 58:
                this.onToken(COLON, ":");
                break;

              case 44:
                this.onToken(COMMA, ",");
                break;

              case 116:
                this.tState = TRUE1;
                break;

              case 102:
                this.tState = FALSE1;
                break;

              case 110:
                this.tState = NULL1;
                break;

              case 34:
                this.string = "";
                this.tState = STRING1;
                break;

              case 45:
                this.negative = true;
                this.tState = NUMBER1;
                break;

              case 48:
                this.magnatude = 0;
                this.tState = NUMBER2;
                break;

              default:
                if (n > 48 && n < 64) {
                    this.magnatude = n - 48;
                    this.tState = NUMBER3;
                } else if (n === 32 || n === 9 || n === 10 || n === 13) {} else {
                    this.charError(buffer, i);
                }
                break;
            }
            break;

          case STRING1:
            n = buffer[i];
            if (n === 34) {
                this.tState = START;
                this.onToken(STRING, this.string);
                this.string = undefined;
            } else if (n === 92) {
                this.tState = STRING2;
            } else if (n >= 32) {
                this.string += String.fromCharCode(n);
            } else {
                this.charError(buffer, i);
            }
            break;

          case STRING2:
            n = buffer[i];
            switch (n) {
              case 34:
                this.string += '"';
                this.tState = STRING1;
                break;

              case 92:
                this.string += "\\";
                this.tState = STRING1;
                break;

              case 47:
                this.string += "/";
                this.tState = STRING1;
                break;

              case 98:
                this.string += "\b";
                this.tState = STRING1;
                break;

              case 102:
                this.string += "\f";
                this.tState = STRING1;
                break;

              case 110:
                this.string += "\n";
                this.tState = STRING1;
                break;

              case 114:
                this.string += "\r";
                this.tState = STRING1;
                break;

              case 116:
                this.string += "	";
                this.tState = STRING1;
                break;

              case 117:
                this.unicode = "";
                this.tState = STRING3;
                break;

              default:
                this.charError(buffer, i);
                break;
            }
            break;

          case STRING3:
          case STRING4:
          case STRING5:
          case STRING6:
            n = buffer[i];
            if (n >= 48 && n < 64 || n > 64 && n <= 70 || n > 96 && n <= 102) {
                this.unicode += String.fromCharCode(n);
                if (this.tState++ === STRING6) {
                    this.string += String.fromCharCode(parseInt(this.unicode, 16));
                    this.unicode = undefined;
                    this.tState = STRING1;
                }
            } else {
                this.charError(buffer, i);
            }
            break;

          case NUMBER1:
            n = buffer[i];
            if (n === 48) {
                this.magnatude = 0;
                this.tState = NUMBER2;
            } else if (n > 48 && n < 64) {
                this.magnatude = n - 48;
                this.tState = NUMBER3;
            } else {
                this.charError(buffer, i);
            }
            break;

          case NUMBER2:
            switch (buffer[i]) {
              case 46:
                this.position = .1;
                this.tState = NUMBER4;
                break;

              case 101:
              case 69:
                this.exponent = 0;
                this.tState = NUMBER6;
                break;

              default:
                this.tState = START;
                this.onToken(NUMBER, 0);
                this.magnatude = undefined;
                this.negative = undefined;
                i--;
                break;
            }
            break;

          case NUMBER3:
            n = buffer[i];
            switch (n) {
              case 46:
                this.position = .1;
                this.tState = NUMBER4;
                break;

              case 101:
              case 69:
                this.exponent = 0;
                this.tState = NUMBER6;
                break;

              default:
                if (n >= 48 && n < 64) {
                    this.magnatude = this.magnatude * 10 + n - 48;
                } else {
                    this.tState = START;
                    if (this.negative) {
                        this.magnatude = -this.magnatude;
                        this.negative = undefined;
                    }
                    this.onToken(NUMBER, this.magnatude);
                    this.magnatude = undefined;
                    i--;
                }
                break;
            }
            break;

          case NUMBER4:
            n = buffer[i];
            if (n >= 48 && n < 64) {
                this.magnatude += this.position * (n - 48);
                this.position /= 10;
                this.tState = NUMBER5;
            } else {
                this.charError(buffer, i);
            }
            break;

          case NUMBER5:
            n = buffer[i];
            if (n >= 48 && n < 64) {
                this.magnatude += this.position * (n - 48);
                this.position /= 10;
            } else if (n === 101 || n === 69) {
                this.exponent = 0;
                this.tState = NUMBER6;
            } else {
                this.tState = START;
                if (this.negative) {
                    this.magnatude = -this.magnatude;
                    this.negative = undefined;
                }
                this.onToken(NUMBER, this.negative ? -this.magnatude : this.magnatude);
                this.magnatude = undefined;
                this.position = undefined;
                i--;
            }
            break;

          case NUMBER6:
            n = buffer[i];
            if (n === 43 || n === 45) {
                if (n === 45) {
                    this.negativeExponent = true;
                }
                this.tState = NUMBER7;
            } else if (n >= 48 && n < 64) {
                this.exponent = this.exponent * 10 + (n - 48);
                this.tState = NUMBER8;
            } else {
                this.charError(buffer, i);
            }
            break;

          case NUMBER7:
            n = buffer[i];
            if (n >= 48 && n < 64) {
                this.exponent = this.exponent * 10 + (n - 48);
                this.state = NUMBER8;
            } else {
                this.charError(buffer, i);
            }
            break;

          case NUMBER8:
            n = buffer[i];
            if (n >= 48 && n < 64) {
                this.exponent = this.exponent * 10 + (n - 48);
            } else {
                if (this.negativeExponent) {
                    this.exponent = -this.exponent;
                    this.negativeExponent = undefined;
                }
                this.magnatude *= Math.pow(10, this.exponent);
                this.exponent = undefined;
                if (this.negative) {
                    this.magnatude = -this.magnatude;
                    this.negative = undefined;
                }
                this.tState = START;
                this.onToken(NUMBER, this.magnatude);
                this.magnatude = undefined;
                i--;
            }
            break;

          case TRUE1:
            if (buffer[i] === 114) {
                this.tState = TRUE2;
            } else {
                this.charError(buffer, i);
            }
            break;

          case TRUE2:
            if (buffer[i] === 117) {
                this.tState = TRUE3;
            } else {
                this.charError(buffer, i);
            }
            break;

          case TRUE3:
            if (buffer[i] === 101) {
                this.tState = START;
                this.onToken(TRUE, true);
            } else {
                this.charError(buffer, i);
            }
            break;

          case FALSE1:
            if (buffer[i] === 97) {
                this.tState = FALSE2;
            } else {
                this.charError(buffer, i);
            }
            break;

          case FALSE2:
            if (buffer[i] === 108) {
                this.tState = FALSE3;
            } else {
                this.charError(buffer, i);
            }
            break;

          case FALSE3:
            if (buffer[i] === 115) {
                this.tState = FALSE4;
            } else {
                this.charError(buffer, i);
            }
            break;

          case FALSE4:
            if (buffer[i] === 101) {
                this.tState = START;
                this.onToken(FALSE, false);
            } else {
                this.charError(buffer, i);
            }
            break;

          case NULL1:
            if (buffer[i] === 117) {
                this.tState = NULL2;
            } else {
                this.charError(buffer, i);
            }
            break;

          case NULL2:
            if (buffer[i] === 108) {
                this.tState = NULL3;
            } else {
                this.charError(buffer, i);
            }
            break;

          case NULL3:
            if (buffer[i] === 108) {
                this.tState = START;
                this.onToken(NULL, null);
            } else {
                this.charError(buffer, i);
            }
            break;
        }
    }
};

proto.onToken = function(token, value) {};

proto.parseError = function(token, value) {
    this.onError(new Error("Unexpected " + toknam(token) + (value ? "(" + JSON.stringify(value) + ")" : "") + " in state " + toknam(this.state)));
};

proto.onError = function(err) {
    throw err;
};

proto.push = function() {
    this.stack.push({
        value: this.value,
        key: this.key,
        mode: this.mode
    });
};

proto.pop = function() {
    var value = this.value;
    var parent = this.stack.pop();
    this.value = parent.value;
    this.key = parent.key;
    this.mode = parent.mode;
    this.emit(value);
    if (!this.mode) {
        this.state = VALUE;
    }
};

proto.emit = function(value) {
    if (this.mode) {
        this.state = COMMA;
    }
    this.onValue(value);
};

proto.onValue = function(value) {};

proto.onToken = function(token, value) {
    switch (this.state) {
      case VALUE:
        switch (token) {
          case STRING:
          case NUMBER:
          case TRUE:
          case FALSE:
          case NULL:
            if (this.value) {
                this.value[this.key] = value;
            }
            this.emit(value);
            break;

          case LEFT_BRACE:
            this.push();
            if (this.value) {
                this.value = this.value[this.key] = {};
            } else {
                this.value = {};
            }
            this.key = undefined;
            this.state = KEY;
            this.mode = OBJECT;
            break;

          case LEFT_BRACKET:
            this.push();
            if (this.value) {
                this.value = this.value[this.key] = [];
            } else {
                this.value = [];
            }
            this.key = 0;
            this.mode = ARRAY;
            this.state = VALUE;
            break;

          case RIGHT_BRACE:
            if (this.mode === OBJECT) {
                this.pop();
            } else {
                this.parseError(token, value);
            }
            break;

          case RIGHT_BRACKET:
            if (this.mode === ARRAY) {
                this.pop();
            } else {
                this.parseError(token, value);
            }
            break;

          default:
            this.parseError(token, value);
            break;
        }
        break;

      case KEY:
        if (token === STRING) {
            this.key = value;
            this.state = COLON;
        } else if (token === RIGHT_BRACE) {
            this.pop();
        } else {
            this.parseError(token, value);
        }
        break;

      case COLON:
        if (token === COLON) {
            this.state = VALUE;
        } else {
            this.parseError(token, value);
        }
        break;

      case COMMA:
        if (token === COMMA) {
            if (this.mode === ARRAY) {
                this.key++;
                this.state = VALUE;
            } else if (this.mode === OBJECT) {
                this.state = KEY;
            }
        } else if (token === RIGHT_BRACKET && this.mode === ARRAY || token === RIGHT_BRACE && this.mode === OBJECT) {
            this.pop();
        } else {
            this.parseError(token, value);
        }
        break;

      default:
        this.parseError(token, value);
    }
};

module.exports = Parser;