function merge(schema, options) {
/* "set option" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
	options || (options = {})

  function nestedPath(obj,path,val){if("object"!==typeof obj)return obj;var d=path.split(".");if(1<d.length)return path=d.shift(),nestedPath(obj[path],d.join("."),val);void 0!==val&&(obj[path]=val);return obj[path]};
/* "schema.pre" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/* "methods" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/
	schema.method('merge', function (doc) {
		var self = this
		schema.eachPath(function (name) {
			var val = nestedPath(doc, name);

			// Merge all set fields, except for the ObjectID
			if (name !== '_id' && val !== undefined) {
				nestedPath(self, name, val)
			}
		})
		return this;
	})
/* "statics" : {
      [authenticate, register, authenticate]
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/


/* "virtual" : {
  ━━━━━━━━━━━━━━━━━━━━━━━━━━*/

}

module.exports = merge


