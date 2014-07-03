define("pandora/widget/1.0.0/widget-debug", [ "$-debug", "pandora/base/1.0.0/base-debug", "pandora/class/1.0.0/class-debug", "pandora/events/1.0.0/events-debug" ], function(require, exports, module) {
    /**
 * 组件基类
 *
 * @module Widget
 */
    "use strict";
    var $ = require("$-debug"), Base = require("pandora/base/1.0.0/base-debug");
    var DELEGATE_REGEXP = /\{\{(.+?)\}\}/g, DELEGATE_DELIMITER = /^(\S+)\s*(.*)$/, DELEGATE_NS_PREFIX = ".delegate-widget-", DATA_WIDGET_UNIQUEID = "data-widget-uid";
    var cachedInstances = {};
    function each(obj, func) {
        var p;
        for (p in obj) {
            func.call(null, p, obj[p]);
        }
    }
    // TODO: 检查是否有内存泄漏发生
    /**
 * 组件基类
 *
 * @class Widget
 * @constructor
 * @extends Base
 *
 * @example
 * ```
 * // 创建子类
 * var PersonWidget = Widget.extend({
 *   setup: function () {
 *     // 通知事件 `setup`
 *     this.fire('setup', this.option('name'), this.option('age'));
 *   }
 * });
 * // 创建子类实例
 * var tom = new PersonWidget({
 *   name: 'Tom',
 *   age: 21,
 *   // 订阅事件
 *   events: {
 *     // `setup`
 *     setup: function (e, name, age) {
 *       // e.type === 'setup'
 *       // name === 'Tom'
 *       // age === 21
 *       // this === tom
 *     },
 *     // AOP `before:setup`
 *     'before:setup': function (e) {
 *       // 执行 `setup` 方法前执行
 *       // 此处返回 `false` 将阻止 `setup` 方法执行
 *     },
 *     // AOP `before:setup`
 *     'before:setup': function (e) {
 *       // 执行 `setup` 方法后执行
 *       // 如果 `setup` 方法被阻止，就不会执行到这里
 *     }
 *   },
 *   // 代理事件
 *   delegates: {
 *     'click': function (e) {
 *       // e.target === this.element[0]
 *       // this === tom
 *     },
 *     'mouseover .avatar': function (e) {
 *       // 鼠标悬停在 element 里的 `.avatar` 元素
 *     }
 *   }
 * });
 * ```
 */
    var Widget = Base.extend({
        /**
   * 初始化函数，将自动执行；实现事件自动订阅与初始化组件参数
   *
   * @method initialize
   * @param {Object} [options] 组件参数
   */
        initialize: function() {
            var self = this;
            Widget.superclass.initialize.apply(self, arguments);
            // self.UI = {
            //   'default': {}
            // };
            /**
     * 实例唯一ID
     *
     * @property {String} uniqueId
     */
            self.uniqueId = uniqueId();
            /**
     * 用于 DOM 事件绑定的 NAMESPACE
     *
     * @property {String} delegateNS
     */
            self.delegateNS = DELEGATE_NS_PREFIX + self.uniqueId;
            self.initCnE();
            self.initDelegates();
            self.setup();
            // 储存实例
            cachedInstances[self.uniqueId] = self;
        },
        /**
   * 默认参数，子类自动继承并覆盖
   *
   * @property {Object} defaults
   * @type {Object}
   */
        defaults: {
            // 默认插入到的容器，设置为 `null` 则不执行插入
            container: "body",
            classPrefix: "ue-component",
            contentRole: "content",
            // CSS表，初始化时自动设置
            css: {},
            // 模板数据
            data: {},
            // TODO: ue-component 改成 pandora 之类的，以与旧版组件做区别？
            element: "<div></div>",
            // 实现 element 插入到 DOM，基于 container
            insert: function() {
                this.container.length && this.container.append(this.element);
            }
        },
        /**
   * 寻找 element 后代，参数为空时，返回 element
   *
   * @method $
   * @param {Mixed} [selector] 选择符
   * @return {Object} jQuery 包装的 DOM 节点
   */
        $: function(selector) {
            return selector ? this.element.find(selector) : this.element;
        },
        /**
   * 获取 role 对应的元素，通过 [data-role=xxx]
   *
   * @method role
   * @param {Mixed} role data-role 的值
   * @return {Object} jQuery 包装的 DOM 节点
   */
        role: function(role) {
            return this.$(role.replace(/(?:^\b|\s*,\s*)([_0-9a-zA-Z\-]+)/g, ',[data-role="$1"]').substring(1));
        },
        /**
   * 获取模板，基于 `option` 方法
   *
   * @method data
   * @param {String} [key] 键
   * @param {Mixed} [value] 值
   * @param {Boolean} [override] 是否覆盖（即非深度复制）
   * @return {Mixed} 整个 data 参数列表或指定参数值
   */
        data: function(key, value, override) {
            return this.option(key, value, "data", override);
        },
        /**
   * 初始化 `container` 与 `element`
   *
   * @method initCnE
   * @return {Object} 当前实例
   */
        initCnE: function() {
            /**
     * 容器/插入参考点
     *
     * @property {Object} container（容器）
     */
            this.container = $(this.option("container"));
            /**
     * 组件根元素
     *
     * @property {Object} element
     */
            this.element = $(this.option("element")).attr(DATA_WIDGET_UNIQUEID, this.uniqueId).addClass(this.option("classPrefix")).css(this.option("css"));
            return this;
        },
        /**
   * 初始化 `document` 与 `viewport`
   *
   * @method initDnV
   * @return {Object} 当前实例
   */
        initDnV: function() {
            /**
     * `element` 所在的 `document` 对象
     *
     * @property {Document} document
     */
            this.document = this.element.prop("ownerDocument");
            /**
     * `element` 所在的 `window` 对象
     *
     * @property {Window} viewport
     */
            this.viewport = function(doc) {
                return doc.defaultView || doc.parentWindow;
            }(this.document);
            return this;
        },
        /**
   * 事件代理，绑定在 element 上
   *
   * @method initDelegates
   * @param {Object|Function} [delegates] 代理事件列表
   * @param {jQuery} [element] 绑定代理事件的元素
   * @return {Object} 当前实例
   */
        initDelegates: function(delegates, element) {
            var self = this;
            delegates || (delegates = self.option("delegates"));
            if (!delegates) {
                return self;
            }
            if (typeof delegates === "function") {
                delegates = delegates.call(self);
            }
            element = element ? $(element) : self.element;
            each(delegates, function(key, callback) {
                var match = key.replace(DELEGATE_REGEXP, function($0, $1) {
                    return self.option($1) || "";
                }).match(DELEGATE_DELIMITER), event = match[1] + self.delegateNS;
                if (typeof callback === "string") {
                    callback = self[callback];
                }
                if (match[2]) {
                    element.on(event, match[2], function() {
                        callback.apply(self, arguments);
                    });
                } else {
                    element.on(event, function() {
                        callback.apply(self, arguments);
                    });
                }
            });
            return self;
        },
        /**
   * 显示触发器
   *
   * @method initTrigger
   * @param {String} [trigger] 触发器
   * @return {Object} 当前实例
   */
        initTrigger: function(trigger) {
            var self = this, delegates = {};
            trigger || (trigger = self.option("trigger"));
            if (!trigger) {
                return self;
            }
            delegates["click " + trigger] = function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.activeTrigger = e.currentTarget;
                self.show();
            };
            self.initDelegates(delegates, self.document);
            // 如果有 trigger，则默认隐藏
            self.element.hide();
            return self;
        },
        /**
   * 自动执行的设置函数，预留用于子类覆盖
   *
   * @method setup
   */
        setup: function() {},
        /**
   * 处理子组件，仅支持 widget 的子类
   *
   * @method handleChildren
   */
        handleChildren: function() {
            var self = this, container, i, n, children = self.option("children");
            if (children) {
                container = self.role(self.option("contentRole"));
                if (container.length === 0) {
                    container = self.element;
                }
                for (i = 0, n = children.length; i < n; i++) {
                    container.append(children[i].element);
                }
            }
        },
        /**
   * 解析内容，将 elemnt 插入到 container
   *
   * @method render
   * @return {Object} 当前实例
   */
        render: function() {
            var self = this, html, template = self.option("template");
            // 处理模板与 content 为 text|html 的情况
            if (typeof template === "function") {
                html = template(self.data(), self.option("templateOptions"));
            } else {
                html = self.option("content");
            }
            if (typeof html !== "undefined") {
                self.element.html(html);
            }
            self.handleChildren();
            if (!self.rendered) {
                // 插入到容器中
                self.option("insert").call(self);
                self.initDnV();
                self.initTrigger();
                self.rendered = true;
            }
            /**
     * 通知渲染
     *
     * @event render
     * @param {Object} e Event.
     */
            self.fire("render");
            return self;
        },
        /**
   * 判断：显示状态等，参见 `jq` 的 `is`
   *
   * @example
   * ```
   * instance.is(':hidden')
   * ```
   *
   * @method is
   * @param {Mixed} condition 判断语句
   * @return {Boolean}
   */
        is: function(contidtion) {
            return this.element.is(contidtion);
        },
        /**
   * 显示
   *
   * @method show
   * @return {Object} 当前实例
   */
        show: function() {
            if (!this.element) {
                return this;
            }
            this.element.show();
            /**
     * 通知显示
     *
     * @event show
     * @param {Object} e Event.
     */
            this.fire("show");
            return this;
        },
        /**
   * 隐藏
   *
   * @method hide
   * @return {Object} 当前实例
   */
        hide: function() {
            if (!this.element) {
                return this;
            }
            this.element.hide();
            /**
     * 通知隐藏
     *
     * @event hide
     * @param {Object} e Event.
     */
            this.fire("hide");
            return this;
        },
        /**
   * 销毁当前组件对象
   * @method destroy
   */
        destroy: function() {
            /**
     * 通知销毁
     *
     * @event destroy
     * @param {Object} e Event.
     */
            this.fire("destroy");
            // 移除 element 事件代理
            if (this.element) {
                this.element.add(this.document).add(this.viewport).off(this.delegateNS);
                // 从DOM中移除element
                this.element.remove();
            }
            Widget.superclass.destroy.apply(this);
        }
    });
    var uniqueId = function() {
        var ids = {};
        return function() {
            var id = Math.random().toString(36).substr(2);
            if (ids[id]) {
                return uniqueId();
            }
            ids[id] = true;
            return id;
        };
    }();
    // For memory leak, from aralejs
    $(window).unload(function() {
        var uid;
        for (uid in cachedInstances) {
            cachedInstances[uid].destroy();
        }
    });
    /**
 * 通过 element 取 widget 实例
 *
 * @method get
 * @return {Mixed} selector
 * @static
 */
    Widget.get = function(selector) {
        var element = $(selector).eq(0), uid;
        element.length && (uid = element.attr(DATA_WIDGET_UNIQUEID));
        return cachedInstances[uid];
    };
    module.exports = Widget;
});
