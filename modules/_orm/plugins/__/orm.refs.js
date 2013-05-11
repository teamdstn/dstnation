function refs(schema, options) {
	options = options || {}

	schema.method('getdbrefs', function (fn) {
		var _refs = {}, self = this
		schema.eachPath(function (name, path) {
			var caster = path.caster
					, opt = path.options
			if (caster && caster.options && caster.options.ref) {
				_refs[caster.options.ref] = self[name]
			} else if (opt && opt.ref) {
				_refs[opt.ref] = self[name]
			}
		})
		fn && fn(null, _refs)
		return _refs
	})
}

module.exports = refs
