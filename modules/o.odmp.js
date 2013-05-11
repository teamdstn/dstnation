var EventEmitter = require('events').EventEmitter, fs = require('fs'), pt = require('path'), mongoose = require('mongoose'), logger = require('./logger'), streams = require('./_orm/streams'), regex = require('./_orm/regex'), qry = require('./_orm/query'), $u = require('./_orm/util');
exports = module.exports = create;
var Schema = exports.Schema = mongoose.Schema, ObjectId = mongoose.Schema.ObjectId, Mixed = mongoose.Types.Mixed;
function merge(a$0, b$1) {
    if (a$0 && b$1) {
        for (var key$3 in b$1) {
            a$0[key$3] = b$1[key$3];
        }
    }
    return a$0;
}
function create(nm$4, options$5) {
    options$5 = options$5 || {};
    function odm(nm$7, options$8) {
        if (!odm.connection)
            odm.error('mongoose is required');
        return {
            __mounted: function (app$10) {
                console.log('mounder');
                odm.route(this.route, app$10);
            },
            handle: function (req$12, res$13, next$14) {
                res$13.contentType('json');
                next$14();
            },
            set: function (nested$16, path$17) {
                self[nested$16] = path$17;
            },
            emit: function (evt$19, app$20) {
                evt$19 === 'mount' && this.__mounted(app$20);
            },
            routes: {}
        };
    }
    merge(odm, proto);
    odm.connection = options$5.connection || mongoose.createConnection();
    odm.open = function odm(nm$22, models$23) {
        this.connection.open('mongodb://localhost/' + nm$22);
        this.connection.once('connected', function () {
            odm.log.info('conn');
        });
        this._routes = [];
        if (models$23) {
            odm.models = {};
            this._routes = Object.keys(models$23);
            $u.each(models$23, function (v$26, k$27) {
                odm.jsonSchema(k$27, v$26);
            });
        }
        return odm.connection;
    };
    odm.stream = options$5.stream || streams.JStream;
    odm.trans = options$5.trans || streams.transit();
    odm.log = logger.create('odm');
    odm.error = odm.log.error;
    odm._routes = options$5.routes;
    return odm;
}
var proto = {};
proto.routes = {};
proto.transit = function create(strm$29, query$30, m$31) {
    return this.trans.pump(strm$29, m$31, query$30.trans);
};
proto.responseStream = function create(strm$33, query$34, m$35) {
    return new this.stream() || streams.JStream;
};
proto.model = function create(m$37) {
    var _cconnection$39 = this.connection;
    Object(m$37) === m$37 && (m$37 = m$37.param || m$37.param('type'));
    return qry.model(_cconnection$39, m$37);
};
proto.run = function create(meta$40, tostream$41) {
    if (!tostream$41) {
        tostream$41 = meta$40;
        meta$40 = {};
    }
    return this.responseStream(meta$40).procedure(tostream$41);
};
proto.find = function create(m$43, fnd$44, req$45, res$46, next$47) {
    var self$56 = this;
    var _single$57 = req$45.query.single;
    return function (err$49, cnt$50) {
        if (err$49)
            return next$47(err$49);
        qry.populate(fnd$44, req$45.query);
        qry.paginate(fnd$44, req$45.query);
        qry.sort(fnd$44, req$45.query);
        var _stream$55 = self$56.transit(self$56.createStream(fnd$44, req$45, res$46, next$47), req$45.query, m$43);
        if (req$45.query.filter && m$43) {
            qry.filter(fnd$44, req$45.query, m$43);
            fnd$44.count(function (err$52, fcnt$53) {
                if (err$52)
                    return next$47(err$52);
                _stream$55.pipe(self$56.responseStream({
                    total: cnt$50,
                    filterTotal: fcnt$53
                }, _single$57)).pipe(res$46);
            });
        } else {
            _stream$55.pipe(self$56.responseStream({total: cnt$50}, _single$57)).pipe(res$46);
        }
    };
};
proto.createStream = function create(query$58, req$59, res$60, next$61) {
    var self$65 = this;
    var _stream$66 = query$58.stream();
    _stream$66.on('error', function (err$63) {
        console.error('stream error [' + (err$63 && err$63.message || 'unknown') + ']');
        this.destroy();
        return self$65.err(err$63, req$59, res$60, next$61);
    });
    return _stream$66;
};
proto.route = function create(nested$67, app$68) {
    var self$132 = this, _nested$133 = [
            '^\\/(' + this._routes.join('|') + ')',
            '\\/(?:([^\\/]+?))\\',
            '/(?:([^\\/]+?))(?:\\/([\\w\\/]+?))?\\/?$',
            '\\/?$',
            '\\/*'
        ], _search$134 = 'find';
    app$68.get(RegExp(_nested$133[0] + _nested$133[4], 'i'), function (req$70, res$71, next$72) {
        var _xpt$74 = res$71.locals.expose, _rou$75 = _xpt$74.route.split('/').slice(1), _len$76 = _rou$75.length, _mod$77;
        self$132.log.info('pathing in odm', req$70.params[0], _len$76, _xpt$74);
        _mod$77 = self$132.model(req$70);
        var _role$78 = 'name mail';
        if (_len$76 === 1) {
            return _mod$77.count({}, self$132.find(_mod$77, _mod$77.find({}).select(_role$78), req$70, res$71, next$72));
        } else if (_len$76 === 2) {
            self$132.log.info('2', _rou$75[1]);
            next$72();
        } else if (_len$76 === 3 && _rou$75[1] === _search$134) {
            self$132.log.info('3', _rou$75[2]);
            next$72();
        }
    });
    app$68.get(RegExp(_nested$133[0] + '\\/' + _search$134 + _nested$133[2], 'i'), function (req$79, res$80, next$81) {
        console.log('\x1b[31m%s \x1b[0m: \x1b[31m\x1b[1m%j %j \x1b[0m', 'Finds', req$79.params, res$80.locals.expose);
        var _f$83 = req$79.params[1], _mod$84, _arg$85, _fnd$86;
        console.log(req$79.params);
        req$79.params.type = req$79.params[0];
        _mod$84 = self$132.model(req$79);
        console.log(_mod$84, _arg$85);
        _arg$85 = [req$79.query];
        if (req$79.params.length > 2)
            _arg$85 = _arg$85.concat($u.splits(req$79.params[2]));
        console.log(_arg$85);
        _fnd$86 = _mod$84[_f$83].apply(_mod$84, _arg$85);
        _fnd$86.count(self$132.find(_mod$84, _fnd$86, req$79, res$80, next$81));
    });
    app$68.get(RegExp(_nested$133[0] + _nested$133[1] + _nested$133[2]), function (req$87, res$88, next$89) {
        console.log('\x1b[31m%s \x1b[0m: \x1b[31m\x1b[1m%j %j \x1b[0m', 'gets', req$87.params, res$88.locals.expose);
        var _sng$94 = req$87.query.single, _mod$95 = self$132.model(req$87.params[0]), _fnd$96 = _mod$95.findOne(qry.oid(req$87.params[1])), _cbs$97;
        qry.populate(_fnd$96, req$87.query);
        var _pop$98 = req$87.params.length > 1 ? req$87.params[2] : null;
        if (_pop$98) {
            qry.populate(_fnd$96, {populate: [_pop$98]});
            _cbs$97 = new streams.CallbackStream();
            self$132.transit(self$132.createStream(_cbs$97, req$87, res$88, next$89), req$87.query, _mod$95).pipe(self$132.responseStream(null, _sng$94)).pipe(res$88);
            _fnd$96.exec(function (err$91, doc$92) {
                if (err$91)
                    return _cbs$97.emit('error', err$91);
                $u.invoke(doc$92, _pop$98, _cbs$97.procedure());
            });
        } else {
            self$132.transit(self$132.createStream(_fnd$96, req$87, res$88, next$89), req$87.query, _mod$95).pipe(self$132.responseStream(null, _sng$94)).pipe(res$88);
        }
    });
    app$68.get(nested$67 + '/:type?', function (req$99, res$100, next$101) {
        console.error('no haddle', req$99.url);
        res$100.send({
            status: 1,
            message: 'No such url'
        });
    });
    app$68.post(nested$67 + '/:type', function (req$103, res$104, next$105) {
        var _mod$107 = self$132.model(req$103);
        new _mod$107(qry.clean(req$103.body)).save(self$132.run(res$104));
    });
    app$68.put(nested$67 + '/:type/:id', function (req$108, res$109, next$110) {
        var id$119 = req$108.param('id');
        self$132.model(req$108).findOne(qry.oid(req$108), function (err$112, obj$113) {
            if (err$112)
                return next$110(err$112);
            $u.extend(obj$113, qry.clean(req$108.body));
            obj$113.save(function (err$115, ret$116) {
                if (err$115)
                    return next$110(err$115);
                var obj$118 = ret$116.toJSON();
                res$109.send({
                    status: 0,
                    payload: obj$118
                });
            });
        });
    });
    app$68.del(nested$67 + '/:type/:id?', function (req$120, res$121, next$122) {
        var _mod$130 = self$132.model(req$120), _snd$131 = function (err$124, o$125) {
                if (err$124)
                    return next$122(err$124);
                res$121.send({
                    status: 0,
                    payload: null
                });
            };
        _mod$130.findOne(qry.oid(req$120), function (err$127, doc$128) {
            if (err$127)
                return next$122(err$127);
            doc$128.remove(_snd$131);
        });
    });
};
proto.jsonSchema = function create(k$135, v$136, report$137) {
    !$u.is.str(k$135) && err('expected string for param name');
    !$u.is.obj(v$136) && err('expected object for param desc');
    if (!this.connection)
        err('expected a mongoose.Connection params. Call setConnection() before schema()');
    var o$139 = this.convert(v$136.schm || v$136.schema);
    var schema$140 = new Schema(o$139);
    return this.models[k$135] = mongoose.model(k$135, schema$140);
};
proto.convert = function convert(desc$141) {
    var l$146 = desc$141;
    return JSON.parse(JSON.stringify(desc$141), function (k$143, v$144) {
        if ('type' === k$143) {
            v$144 === 'e' && (v$144 = 's', this.validate = proto.gen.get('v', 'email')());
            v$144 === 'u' && (v$144 = 's', this.validate = proto.gen.get('v', 'url')());
            return proto.gen.type(v$144);
        } else if (/^(view)/.test(k$143)) {
            console.log(k$143, v$144);
            v$144 = null;
        } else if (/^(validate|get|set|default|match)/.test(k$143)) {
            v$144 = v$144.split(':');
            return k$143 === '' ? v$144 : proto.gen.get(k$143, v$144[0])(v$144[1]);
        } else if (/^(lowercase|uppercase|trim|mat|enum|min|max|ref|type|default|required|select|get|set|index|unique|sparse|validate)/.test(k$143)) {
            return v$144;
        } else {
            console.log('\x1b[32m%s \x1b[0m: \x1b[32m\x1b[1m%s \x1b[0m', 'x:', k$143);
        }
        if (k$143 === 'options' || !v$144) {
            delete l$146;
        } else {
            return v$144;
        }
    });
};
proto.gen = {
    hash: {
        validator: regex.validator,
        setter: {},
        getter: {},
        'default': {}
    },
    set: function (p$147, k$148, v$149) {
        var _hash$151 = {
                v: proto.gen.hash.validator,
                d: proto.gen.hash['default'],
                s: proto.gen.hash.setter,
                g: proto.gen.hash.getter
            }[p$147[0]][k$148];
        return v$149 ? _hash$151 = v$149 : _hash$151;
    },
    get: function (p$152, k$153) {
        return proto.gen.set(p$152, k$153);
    },
    type: function (v$155) {
        return {
            a: Array,
            s: String,
            n: Number,
            b: Boolean,
            f: Buffer,
            d: Date,
            o: ObjectId,
            m: Mixed
        }[/buffer/i.test(v$155) ? 'f' : v$155[0]];
    },
    tags: function (v$157) {
    }
};