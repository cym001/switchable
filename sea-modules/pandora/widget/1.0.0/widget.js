/*! widget-1.0.0 2014-06-30 19:13:43 */
define("pandora/widget/1.0.0/widget", ["$", "pandora/base/1.0.0/base", "pandora/class/1.0.0/class", "pandora/events/1.0.0/events"], function (a, b, c) {
    "use strict";
    function d(a, b) {
        var c;
        for (c in a)b.call(null, c, a[c])
    }

    var e = a("$"), f = a("pandora/base/1.0.0/base"), g = /\{\{(.+?)\}\}/g, h = /^(\S+)\s*(.*)$/, i = ".delegate-widget-", j = "data-widget-uid", k = {}, l = f.extend({initialize: function () {
        var a = this;
        l.superclass.initialize.apply(a, arguments), a.uniqueId = m(), a.delegateNS = i + a.uniqueId, a.initCnE(), a.initDelegates(), a.setup(), k[a.uniqueId] = a
    }, defaults: {container: "body", classPrefix: "ue-component", contentRole: "content", css: {}, data: {}, element: "<div></div>", insert: function () {
        this.container.length && this.container.append(this.element)
    }}, $: function (a) {
        return a ? this.element.find(a) : this.element
    }, role: function (a) {
        return this.$(a.replace(/(?:^\b|\s*,\s*)([_0-9a-zA-Z\-]+)/g, ',[data-role="$1"]').substring(1))
    }, data: function (a, b, c) {
        return this.option(a, b, "data", c)
    }, initCnE: function () {
        return this.container = e(this.option("container")), this.element = e(this.option("element")).attr(j, this.uniqueId).addClass(this.option("classPrefix")).css(this.option("css")), this
    }, initDnV: function () {
        return this.document = this.element.prop("ownerDocument"), this.viewport = function (a) {
            return a.defaultView || a.parentWindow
        }(this.document), this
    }, initDelegates: function (a, b) {
        var c = this;
        return a || (a = c.option("delegates")), a ? ("function" == typeof a && (a = a.call(c)), b = b ? e(b) : c.element, d(a, function (a, d) {
            var e = a.replace(g,function (a, b) {
                return c.option(b) || ""
            }).match(h), f = e[1] + c.delegateNS;
            "string" == typeof d && (d = c[d]), e[2] ? b.on(f, e[2], function () {
                d.apply(c, arguments)
            }) : b.on(f, function () {
                d.apply(c, arguments)
            })
        }), c) : c
    }, initTrigger: function (a) {
        var b = this, c = {};
        return a || (a = b.option("trigger")), a ? (c["click " + a] = function (a) {
            a.preventDefault(), a.stopPropagation(), b.activeTrigger = a.currentTarget, b.show()
        }, b.initDelegates(c, b.document), b.element.hide(), b) : b
    }, setup: function () {
    }, handleChildren: function () {
        var a, b, c, d = this, e = d.option("children");
        if (e)for (a = d.role(d.option("contentRole")), 0 === a.length && (a = d.element), b = 0, c = e.length; c > b; b++)a.append(e[b].element)
    }, render: function () {
        var a, b = this, c = b.option("template");
        return a = "function" == typeof c ? c(b.data(), b.option("templateOptions")) : b.option("content"), "undefined" != typeof a && b.element.html(a), b.handleChildren(), b.rendered || (b.option("insert").call(b), b.initDnV(), b.initTrigger(), b.rendered = !0), b.fire("render"), b
    }, is: function (a) {
        return this.element.is(a)
    }, show: function () {
        return this.element ? (this.element.show(), this.fire("show"), this) : this
    }, hide: function () {
        return this.element ? (this.element.hide(), this.fire("hide"), this) : this
    }, destroy: function () {
        this.fire("destroy"), this.element && (this.element.add(this.document).add(this.viewport).off(this.delegateNS), this.element.remove()), l.superclass.destroy.apply(this)
    }}), m = function () {
        var a = {};
        return function () {
            var b = Math.random().toString(36).substr(2);
            return a[b] ? m() : (a[b] = !0, b)
        }
    }();
    e(window).unload(function () {
        var a;
        for (a in k)k[a].destroy()
    }), l.get = function (a) {
        var b, c = e(a).eq(0);
        return c.length && (b = c.attr(j)), k[b]
    }, c.exports = l
});