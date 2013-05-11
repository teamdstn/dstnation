function Block(name) {
    this.name = name;
    this.views = [];
    this.htmls = {};
}

Block.prototype.addHtml = function(view, html) {
    if (!this.htmls[view]) {
        this.views.push(view);
        this.htmls[view] = [];
    }
    this.htmls[view].push(html);
};

Block.prototype.toHtml = function() {
    var html = [];
    var htmls = this.htmls;
    this.views.reverse();
    this.views.forEach(function(view) {
        html.push(htmls[view].join(""));
    });
    this.views.reverse();
    return html.join("");
};

Block.prototype.toString = Block.prototype.toHtml;

module.exports = function(req, res, next) {
    var blocks = {};
    function getBlock(name) {
        return blocks[name] = blocks[name] || new Block(name);
    }
    function getView(context) {
        return context.filename;
    }
    res.locals({
        block: function block(name, html) {
            var block = getBlock(name);
            if (html) {
                block.addHtml(getView(this), html);
            } else {
                return block.toHtml();
            }
        },
        blocks: blocks,
        script: function script(src) {
            getBlock("scripts").addHtml(getView(this), '<script src="' + src + '"></' + "script>");
        },
        scripts: getBlock("scripts"),
        stylesheet: function stylesheet(href, media) {
            getBlock("stylesheets").addHtml(getView(this), '<link rel="stylesheet" href="' + href + (media ? '" media="' + media : "") + '" />');
        },
        stylesheets: getBlock("stylesheets")
    });
    next();
};