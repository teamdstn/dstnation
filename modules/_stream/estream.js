var Stream  = require('stream');
var __instance = {};
var writeMethods  = ["write", "end", "destroy"]
  , readMethods   = ["resume", "pause"]
  , readEvents    = ["data", "close"]
  , slice = Array.prototype.slice
  ;
module.exports = __instance;
__instance.Stream = Stream;

__instance.inherits = function inherits (c, p, proto) {
  proto = proto || {}
  var e = {}
  ;[c.prototype, proto].forEach(function (s) {
    Object.getOwnPropertyNames(s).forEach(function (k) {
      e[k] = Object.getOwnPropertyDescriptor(s, k)
    })
  })
  c.prototype = Object.create(p.prototype, e)
  c.super = p
}

__instance.split = function(matcher) {
  var soFar = '';
  if (!matcher)
    matcher = '\n'
  return __instance.through(function (buffer) {
    var stream = this
      , pieces = (soFar + buffer).split(matcher)
    soFar = pieces.pop()
    pieces.forEach(function (piece) {
      stream.emit('data', piece)
    })
    return true
  },
  function () {
    if(soFar)
      this.emit('data', soFar)
    this.emit('end')
  })
}

__instance.pause = function () {
  var buffer = [], ended = false, destroyed = false
  var stream = new Stream()
  stream.writable = stream.readable = true
  stream.paused = false
  stream.write = function (data) {
    if(!this.paused)
      this.emit('data', data)
    else
      buffer.push(data)
    return !(this.paused || buffer.length)
  }
  function onEnd () {
    stream.readable = false
    stream.emit('end')
    process.nextTick(stream.destroy.bind(stream))
  }
  stream.end = function (data) {
    if(data) this.write(data)
    this.ended = true
    this.writable = false
    if(!(this.paused || buffer.length))
      return onEnd()
    else
      this.once('drain', onEnd)
    this.drain()
  }
  stream.drain = function () {
    while(!this.paused && buffer.length)
      this.emit('data', buffer.shift())
    //if the buffer has emptied. emit drain.
    if(!buffer.length && !this.paused)
      this.emit('drain')
  }
  stream.resume = function () {

    this.paused = false
//    process.nextTick(this.drain.bind(this)) //will emit drain if buffer empties.
    this.drain()
    return this
  }
  stream.destroy = function () {
    if(destroyed) return
    destroyed = ended = true
    buffer.length = 0
    this.emit('close')
  }
  stream.pause = function () {
    stream.paused = true
    return this
  }
  return stream
}
__instance.duplex = function (writer, reader) {
    var stream = new Stream()
        , ended = false
    Object.defineProperties(stream, {
        writable: {
            get: getWritable
        }
        , readable: {
            get: getReadable
        }
    })
    writeMethods.forEach(proxyWriter)
    readMethods.forEach(proxyReader)
    readEvents.forEach(proxyStream)
    reader.on("end",    handleEnd)
    writer.on("error",  reemit)
    reader.on("error",  reemit)
    return stream
    function getWritable() {
        return writer.writable
    }
    function getReadable() {
        return reader.readable
    }
    function proxyWriter(methodName) {
        stream[methodName] = method
        function method() {
            return writer[methodName].apply(writer, arguments)
        }
    }
    function proxyReader(methodName) {
        stream[methodName] = method
        function method() {
            stream.emit(methodName)
            var func = reader[methodName]
            if (func) {
                return func.apply(reader, arguments)
            }
            reader.emit(methodName)
        }
    }
    function proxyStream(methodName) {
        reader.on(methodName, reemit)
        function reemit() {
            var args = slice.call(arguments)
            args.unshift(methodName)
            stream.emit.apply(stream, args)
        }
    }
    function handleEnd() {
        if (ended) {
            return
        }
        ended = true
        var args = slice.call(arguments)
        args.unshift("end")
        stream.emit.apply(stream, args)
    }
    function reemit(err) {
        stream.emit("error", err)
    }
}
__instance.from = function (source) {
  if(Array.isArray(source))
    return __instance.from (function (i) {
      if(source.length)
        this.emit('data', source.shift())
      else
        this.emit('end')
      return true
    })
  var s = new Stream(), i = 0, ended = false, started = false
  s.readable  = true
  s.writable  = false
  s.paused    = false
  s.pause     = function () {
    started = true
    s.paused = true
  };
  function next () {
    var n = 0, r = false
    if(ended) return
    while(!ended && !s.paused && source.call(s, i++, function () {
      if(!n++ && !s.ended && !s.paused)
          next()
    })) ;
  }
  s.resume = function () {
    started = true
    s.paused = false
    next()
  }
  s.on('end', function () {
    ended = true
    s.readable = false
    process.nextTick(s.destroy)
  })
  s.destroy = function () {
    ended = true
    s.emit('close')
  }
  /*
    by default, the stream will start emitting at nextTick
    if you want, you can pause it, after pipeing.
    you can also resume before next tick, and that will also
    work.
  */
  process.nextTick(function () {
    if(!started) s.resume()
  })
  return s;
}
__instance.map = function map(mapper) {
  var stream = new Stream()
    , inputs = 0
    , outputs = 0
    , ended = false
    , paused = false
    , destroyed = false
  stream.writable = true
  stream.readable = true
  stream.write = function () {
    if(ended) throw new Error('map stream is not writable')
    inputs ++
    var args = [].slice.call(arguments)
      , r
      , inNext = false
    //pipe only allows one argument. so, do not
    function next (err) {
      if(destroyed) return
      inNext = true
      outputs ++
      var args = [].slice.call(arguments)
      if(err) {
        args.unshift('error')
        return inNext = false, stream.emit.apply(stream, args)
      }
      args.shift() //drop err
      if (args.length) {
        args.unshift('data')
        r = stream.emit.apply(stream, args)
      }
      if(inputs == outputs) {
        if(paused) paused = false, stream.emit('drain') //written all the incoming events
        if(ended) end()
      }
      inNext = false
    }
    args.push(next)
    try {
      //catch sync errors and handle them like async errors
      var written = mapper.apply(null, args)
      paused = (written === false)
      return !paused
    } catch (err) {
      //if the callback has been called syncronously, and the error
      //has occured in an listener, throw it again.
      if(inNext)
        throw err
      next(err)
      return !paused
    }
  }
  function end (data) {
    //if end was called with args, write it,
    ended = true //write will emit 'end' if ended is true
    stream.writable = false
    if(data !== undefined)
      return stream.write(data)
    else if (inputs == outputs) //wait for processing
      stream.readable = false, stream.emit('end'), stream.destroy()
  }
  stream.end = function (data) {
    if(ended) return
    end()
  }
  stream.destroy = function () {
    ended = destroyed = true
    stream.writable = stream.readable = paused = false
    process.nextTick(function () {
      stream.emit('close')
    })
  }
  stream.pause = function () {
    paused = true
  }
  stream.resume = function () {
    paused = false
  }
  return stream
}
//create a readable writable stream.
__instance.through = function(write, end) {
  write = write || function (data) { this.emit('data', data) }
  end = end || function () { this.emit('end') }
  var ended = false, destroyed = false
  var stream = new Stream()
  stream.readable = stream.writable = true
  stream.paused = false
  stream.write = function (data) {
    write.call(this, data)
    return !stream.paused
  }
  //this will be registered as the first 'end' listener
  //must call destroy next tick, to make sure we're after any
  //stream piped from here.
  stream.on('end', function () {
    stream.readable = false
    if(!stream.writable)
      process.nextTick(function () {
        stream.destroy()
      })
  })
  stream.end = function (data) {
    if(ended) return
    //this breaks, because pipe doesn't check writable before calling end.
    //throw new Error('cannot call end twice')
    ended = true
    if(arguments.length) stream.write(data)
    this.writable = false
    end.call(this)
    if(!this.readable)
      this.destroy()
  }
  stream.destroy = function () {
    if(destroyed) return
    destroyed = true
    ended = true
    stream.writable = stream.readable = false
    stream.emit('close')
  }
  stream.pause = function () {
    stream.paused = true
  }
  stream.resume = function () {
    if(stream.paused) {
      stream.paused = false
      stream.emit('drain')
    }
  }
  return stream
}
__instance.concat = __instance.merge = function (/*streams...*/) {
  var toMerge = [].slice.call(arguments)
  var stream = new Stream()
  var endCount = 0
  stream.writable = stream.readable = true
  toMerge.forEach(function (e) {
    e.pipe(stream, {end: false})
    var ended = false
    e.on('end', function () {
      if(ended) return
      ended = true
      endCount ++
      if(endCount == toMerge.length)
        stream.emit('end')
    })
  })
  stream.write = function (data) {
    this.emit('data', data)
  }
  stream.destroy = function () {
    merge.forEach(function (e) {
      if(e.destroy) e.destroy()
    })
  }
  return stream
}
__instance.writeArray = function (done) {
  if ('function' !== typeof done)
    throw new Error('function writeArray (done): done must be function')
  var a = new Stream ()
    , array = [], isDone = false
  a.write = function (l) {
    array.push(l)
  }
  a.end = function () {
    isDone = true
    done(null, array)
  }
  a.writable = true
  a.readable = false
  a.destroy = function () {
    a.writable = a.readable = false
    if(isDone) return
    done(new Error('destroyed before end'), array)
  }
  return a
}
//return a Stream that reads the properties of an object
//respecting pause() and resume()
__instance.readArray = function (array) {
  var stream = new Stream()
    , i = 0
    , paused = false
    , ended = false
  stream.readable = true
  stream.writable = false
  if(!Array.isArray(array))
    throw new Error('event-stream.read expects an array')
  stream.resume = function () {
    if(ended) return
    paused = false
    var l = array.length
    while(i < l && !paused && !ended) {
      stream.emit('data', array[i++])
    }
    if(i == l && !ended)
      ended = true, stream.readable = false, stream.emit('end')
  }
  process.nextTick(stream.resume)
  stream.pause = function () {
     paused = true
  }
  stream.destroy = function () {
    ended = true
    stream.emit('close')
  }
  return stream
}
//
// readable (asyncFunction)
// return a stream that calls an async function while the stream is not paused.
//
// the function must take: (count, callback) {...
//
__instance.readable = function (func, continueOnError) {
  var stream = new Stream()
    , i = 0
    , paused = false
    , ended = false
    , reading = false
  stream.readable = true
  stream.writable = false
  if('function' !== typeof func)
    throw new Error('event-stream.readable expects async function')
  stream.on('end', function () { ended = true })
  function get (err, data) {
    if(err) {
      stream.emit('error', err)
      if(!continueOnError) stream.emit('end')
    } else if (arguments.length > 1)
      stream.emit('data', data)
    process.nextTick(function () {
      if(ended || paused || reading) return
      try {
        reading = true
        func.call(stream, i++, function () {
          reading = false
          get.apply(null, arguments)
        })
      } catch (err) {
        stream.emit('error', err)
      }
    })
  }
  stream.resume = function () {
    paused = false
    get()
  }
  process.nextTick(get)
  stream.pause = function () {
     paused = true
  }
  stream.destroy = function () {
    stream.emit('end')
    stream.emit('close')
    ended = true
  }
  return stream
}
__instance.mapSync = function (sync) {
  return __instance.through(function write(data) {
    var mappedData = sync(data)
    if (typeof mappedData !== 'undefined')
      this.emit('data', mappedData)
  })
}
__instance.log = function (name) {
  return __instance.through(function (data) {
    var args = [].slice.call(arguments)
    if(name) console.error(name, data)
    else     console.error(data)
    this.emit('data', data)
  })
}
__instance.pipeline = __instance.pipe = __instance.connect = function () {
  var streams = [].slice.call(arguments)
    , first = streams[0]
    , last = streams[streams.length - 1]
    , thepipe = __instance.duplex(first, last)
  if(streams.length == 1)
    return streams[0]
  else if (!streams.length)
    throw new Error('connect called with empty args')
  //pipe all the streams together
  function recurse (streams) {
    if(streams.length < 2)
      return
    streams[0].pipe(streams[1])
    recurse(streams.slice(1))
  }
  recurse(streams)
  function onerror () {
    var args = [].slice.call(arguments)
    args.unshift('error')
    thepipe.emit.apply(thepipe, args)
  }
  streams.forEach(function (stream) {
    stream.on('error', onerror)
  })
  return thepipe
}
__instance.child = function (child) {
  return __instance.duplex(child.stdin, child.stdout)
}
__instance.parse = function () {
  return __instance.through(function (data) {
    var obj
    try {
      if(data) //ignore empty lines
        obj = JSON.parse(data.toString())
    } catch (err) {
      return console.error(err, 'attemping to parse:', data)
    }
    //ignore lines that where only whitespace.
    if(obj !== undefined)
      this.emit('data', obj)
  })
}
__instance.stringify = function () {
  return __instance.mapSync(function (e){
    return JSON.stringify(Buffer.isBuffer(e) ? e.toString() : e) + '\n'
  })
}
__instance.replace = function (from, to) {
  return __instance.pipeline(__instance.split(from), __instance.join(to))
}
__instance.join = function (str) {
  if('function' === typeof str)
    return __instance.wait(str)
  var first = true
  return __instance.through(function (data) {
    if(!first)
      this.emit('data', str)
    first = false
    this.emit('data', data)
    return true
  })
}
__instance.wait = function (callback) {
  var body = ''
  return __instance.through(function (data) { body += data },
    function () {
      this.emit('data', body)
      this.emit('end')
      if(callback) callback(null, body)
    })
}
var setup = function (args) {
  return args.map(function (f) {
  var x = f()
    if('function' === typeof x)
      return __instance.map(x)
    return x
  })
}
__instance.pipeable = function () {
  console.error('warn: event-stream. I have decided that pipeable is a kitchen-sick and will remove soon if no objections')
  console.error('please post an issue if you actually use this. -- dominictarr')
  throw new Error('[EVENT-STREAM] __instance.pipeable is deprecated')
}
