define(function (require, exports, module) {
/**
 * 轮播
 *
 * @module Switchable*/

'use strict';

var $ = require('$'),
  Widget = require('widget');

    var Effects = require('./plugins/effects');
/**
 * 轮播基础模块
 *
 * @class Switchable
 * @constructor
 */
var Switchable = Widget.extend({
    defaults: {
        classPrefix: 'ue-switchable',
        container: null,
        // data:{},
        delegates: {
            '{{triggerType}} [data-role=tab]': 'slide',
            'click [data-role=prev]' : 'prev',
            'click [data-role=next]' : 'next',
            'click [data-role=move2left]': 'slideTabs',
            'click [data-role=move2right]': 'slideTabs'
        },
        // element: '<div></div>',
        // 初始切换到哪个面板
        initialTab: 0,
        paneClass: '',
        // 阻止 location.hash 变化
        preventDefault: true,
        // 触发类型
        triggerType: 'mouseover',
        // 激活样式
        tabClass: 'current',
        tabElement: 'a',
        interval: 3,
        autoplay: false,
        //播放方式 1 左右滚动 2上下滚动 3 渐变
        playMode: '',
        // 切换效果，可取 scrollx | scrolly | fade 或直接传入 effect function
        effect: 'none',
        // 有多少屏
        step: 1,
        // length: function () {
        //     return Math.ceil(this.option('panels').length / this.option('step'))
        // },
        // 可见视图区域的大小。一般不需要设定此值，仅当获取值不正确时，用于手工指定大小
        viewSize: [],
        template: require('./switchable-debug-debug.handlebars')
    },
    setup: function() {
        //初始化隐藏panes
        var panes = this.role('pane');
        if(panes.length > 0) {
            panes.hide();
        } else {
            this.element.parent().parent().find('[data-role=pane]').hide();
        }
        this.setHeightWidth();
        !!this.option('playMode') && this.role('tabs').css('zIndex', 10);
        var initialTab = this.option('initialTab');
        switch (this.option('playMode')) {
            case 1:
                this.option('effect', 'scrollx');
                break;

            case 2:
                this.option('effect', 'scrolly');
                break;

            case 3:
                this.option('effect', 'fade');
                break;

            default:
                break;
        }
        this._initPlugins();
        //间隔为空时，设置
        if (this.element.parent().length) {
            this.option('template', null);
        }
        this.render();
        if (initialTab !== -1) {
            this.role('tab').eq(initialTab).trigger(this.option('triggerType') || 'click');
        }
        //单张图片隐藏切换及取消自动播放
        this.role('tab').length <= 1 && this.role('tabs').hide();
        if (this.role('tab').length > 1) {
            this.option('autoplay') && /[1-9]\d*/.test(this.option('interval')) && this.autoplayInstall();
            //如果为空，添加数字
            this.role('tab').each(function(i, v) {
                var isEmp = $(this).html() === '';
                isEmp && $(this).html(i + 1);
            });
        }
    },
    setHeightWidth: function() {
        var eleWidth = this.element.width();
        if(!this.role('pane').length || !this.option('autoplay')) {
            return;
        }
        var firstImg = this.role('pane').eq(0).find('img');
        var scale = firstImg.prop('width') && firstImg.prop('height') ? firstImg.prop('width') / firstImg.prop('height') : 4/3;
        this.element.height(eleWidth / scale);
        this.role('pane').width(eleWidth).height(eleWidth / scale);
    },
    autoplayInstall: function() {
        var element = this.element;
        var EVENT_NS = '.' + this.uniqueId;
        var timer;
        var interval = this.option('interval') * 1e3;
        var that = this;
        function start() {
            // 停止之前的
            stop();
            // 设置状态
            that.paused = false;
            // 开始现在的
            timer = setInterval(function() {
                if (that.paused) {
                    return;
                }
                that.next();
            }, interval);
        }
        function stop() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            that.paused = true;
        }
        // start autoplay
        start();
        // public api
        this.stop = stop;
        this.start = start;
        // 滚出可视区域后，停止自动播放
        this._scrollDetect = throttle(function() {
            that[isInViewport(element) ? 'start' : 'stop']();
        });
        $(window).on('scroll' + EVENT_NS, this._scrollDetect);
        // 鼠标悬停时，停止自动播放
        this.element.hover(stop, start);
    },
    // 切换到上一视图
    prev: function() {
        //  设置手工向后切换标识, 外部调用 prev 一样
        this._isBackward = true;
        this.autoChange();
    },
    // 切换到下一视图
    next: function() {
        this._isBackward = false;
        this.autoChange();
    },
    autoChange: function() {
        var fromIndex;
        if (this.activeTab) {
            if (this.activeTab.parent().data('role') == 'tabs') {
                fromIndex = this.activeTab.index();
            } else {
                fromIndex = this.activeTab.closest('.' + this.option('tabClass')).index();
            }
        }
        var length = this.role('pane').size();
        var index = this._isBackward ? (fromIndex - 1 + length) % length : (fromIndex + 1) % length;
        this.slide(index, fromIndex);
    },
    getTabIndex: function(el){
      var par = el;
      while(true) {
        if (par.parent().data('role') == 'tabs') {
          break;
        }
        par = par.parent();
      }
      return par.index();
    },
    slide: function(e, fromIndex) {
        var self = this, tabClass = self.option('tabClass'), tabElement = self.option('tabElement'), paneClass = self.option('paneClass'), tab, pane, remote, toIndex;
        if (typeof e === 'number') {
            tab = self.role('tab').eq(e);
        } else if (typeof e === 'string') {
            tab = self.role('tab').filter(function() {
                return this.hash === e;
            });
        } else {
            tab = $(e.currentTarget);
            if (self.option('preventDefault')) {
                e.preventDefault();
            }
        }
        self.role('tabs').find(('.' + tabClass).replace(/\s+/g, '')).removeClass(tabClass);
        if (tab.find(tabElement).length == 0) {
          tab.addClass(tabClass);
        } else {
          tab.find(tabElement).addClass(tabClass);
        }
        toIndex = self.getTabIndex(tab);

        if (/^#([\w-]+)$/.test(tab.prop('hash'))) {
            pane = self.role('pane').filter(tab.prop('hash'));
            if (pane.length === 0) {
                pane = $(tab.prop('hash'));
            }
        } else {
            pane = self.role('pane').eq(toIndex);
            if (!pane.length) {
                pane = this.element.parent().parent().find('[data-role=pane]').eq(toIndex);
            }
        }
        if (pane.length) {
            if (paneClass === '') {
                if (!!this.option('playMode')) {
                    var fromIndexTmp;
                    fromIndexTmp = fromIndex ||  this.activeTab && self.getTabIndex(this.activeTab);
                    if (toIndex != fromIndexTmp) {
                        var panelInfo = this._getPanelInfo(toIndex, fromIndexTmp);
                        this._switchPanel(panelInfo);
                    }
                } else {
                    pane.show().siblings('[data-role=pane]').hide();
                }
            } else {
                pane.addClass(paneClass).siblings((' ' + paneClass).replace(/\s+/g, '.')).removeClass(paneClass);
            }
            remote = pane.data('remote');
            if (remote) {
                pane.removeData('remote');
                pane.load(remote);
            }
        }
        self.activeTab = tab;
        self.activePane = pane;
        self.fire('tab', tab, pane);
    },
    _initPlugins: function() {
        this._plugins = [];
        this._plug(Effects);
    },
    _plug: function(plugin) {
        var pluginAttrs = plugin.defaults;
        if (pluginAttrs) {
            for (var key in pluginAttrs) {
                if (pluginAttrs.hasOwnProperty(key) && // 不覆盖用户传入的配置
                    !(key in this.defaults)) {
                    this.option(key, pluginAttrs[key]);
                }
            }
        }
        if (!plugin.isNeeded.call(this)) {
            return;
        }
        if (plugin.install) {
            plugin.install.call(this);
        }
        this._plugins.push(plugin);
    },
    _getPanelInfo: function(toIndex, fromIndex) {
        var panels = this.role('pane');
        var step = this.option('step');
        var fromPanels, toPanels;
        // 初始情况下 fromIndex 为 undefined
        if (fromIndex > -1) {
            fromPanels = panels.slice(fromIndex * step, (fromIndex + 1) * step);
        }
        toPanels = panels.slice(toIndex * step, (toIndex + 1) * step);
        return {
            toIndex: toIndex,
            fromIndex: fromIndex,
            toPanels: $(toPanels),
            fromPanels: $(fromPanels)
        };
    },
    _switchPanel: function(panelInfo) {
        panelInfo.fromPanels.hide();
        panelInfo.toPanels.show();
    },
    slideTabs: function(e) {
        var container = this.role('tabs').parent(), firstTab = this.role('tab').eq(0), that = this, tabWidth = firstTab.width() * this.role('tab').length, maxSize = Math.ceil(tabWidth / container.width()), flag = $(e.currentTarget).data('role') === 'move2right';
        this.currentTabPos = this.currentTabPos || 1;
        if (!flag && this.currentTabPos == 1 || flag && this.currentTabPos == maxSize) {
            return;
        }
        flag ? this.currentTabPos++ : this.currentTabPos--;
        this.role('tabs').animate({
            marginLeft: - (that.currentTabPos - 1) * container.width()
        }, 'fast');
    }
});

module.exports = Switchable;

// Helpers
// -------

function throttle(fn, ms) {
  ms = ms || 200;
  var throttleTimer;

  function f() {
    f.stop();
    throttleTimer = setTimeout(fn, ms);
  }

  f.stop = function () {
    if (throttleTimer) {
      clearTimeout(throttleTimer);
      throttleTimer = 0;
    }
  };

  return f;
}


function isInViewport(element) {
  var scrollTop = $(window).scrollTop();
  var scrollBottom = scrollTop + $(window).height();
  var elementTop = element.offset().top;
  var elementBottom = elementTop + element.height();

  // 只判断垂直位置是否在可视区域，不判断水平。只有要部分区域在可视区域，就返回 true
  return elementTop < scrollBottom && elementBottom > scrollTop;
}

});



function d(data, options) {
 options || (options = {})
    options.helpers || (options.helpers = {})
    for (var key in Handlebars.helpers) {
        options.helpers[key] = options.helpers[key] || Handlebars.helpers[key]
    }
    return Handlebars.compile(source)(data, options)
}
