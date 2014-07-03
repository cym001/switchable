define(function (require, exports, module) {
/**
 * 轮播
 *
 * @module Switchable
 */
'use strict';

var $ = require('$'), 
  Widget = require('widget');
/**
 * 轮播基础模块
 *
 * @class Switchable
 * @constructor
 */
var Switchable = Widget.extend({

  defaults: {
    classPrefix: 'ue-switchable',
    // 上一张按钮
    prevButton: null,
    // 下一张按钮
    nextButton: null,
    container: null,
    // data:{},
    delegates: {
      '{{triggerType}} [data-role=tab]': 'slide'
    },
    // element: '<div></div>',
    // 初始切换到哪个面板
    initialTab: 0,
    paneClass: 'active in',
    // 阻止 location.hash 变化
    preventDefault: true,
    // 触发类型
    triggerType: 'mouseover',
    // 激活样式
    tabClass: 'active',

    interval: 5000,
    autoplay: true,
    // 触发延迟
    // delay: 3000,
    // 一屏内有多少个 panels
    //step: 1,
    // 有多少屏
    // length: function () {
    //     return Math.ceil(this.option('panels').length / this.option('step'))
    // },
    // 可见视图区域的大小。一般不需要设定此值，仅当获取值不正确时，用于手工指定大小
    // viewSize: [],
    template: require('./switchable.handlebars')

  },

  setup: function () {
    var initialTab = this.option('initialTab');

    if (this.element.parent().length) {
      this.option('template', null);
    }
    this.render();
    if (initialTab !== -1) {
        this.role('tab')
        .eq(initialTab)
        .trigger(this.option('triggerType') || 'click');
    }
    this.option('autoplay') && this.autoplayInstall();
  },
  autoplayInstall: function () {
    var element = this.element;
    var EVENT_NS = '.' + this.uniqueId;
    var timer;
    var interval = this.option('interval');
    var that = this;



    function start() {
      // 停止之前的
      stop();

      // 设置状态
      that.paused = false;

      // 开始现在的
      timer = setInterval(function () {
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
    this._scrollDetect = throttle(function () {
      that[isInViewport(element) ? 'start' : 'stop']();
    });
    $(window).on('scroll' + EVENT_NS, this._scrollDetect);

    // 鼠标悬停时，停止自动播放
    this.element.hover(stop, start);
  },
  // 切换到上一视图
  prev: function () {
    //  设置手工向后切换标识, 外部调用 prev 一样
    this._isBackward = true;

    var fromIndex = this.activeTab && this.activeTab.index() || this.option('initialTab');
    var length = this.role('pane').size();
    // 考虑循环切换的情况
    var index = (fromIndex - 1 + length) % length;
    this.slide(index);
  },

  // 切换到下一视图
  next: function () {
    this._isBackward = false;
    var fromIndex = this.activeTab && this.activeTab.index() || this.option('initialTab');
    var length = this.role('pane').size();
    var index = (fromIndex + 1) % length;
    this.slide(index);
  },
  slide: function (e) {
    var self = this,
      tabClass = self.option('tabClass'),
      paneClass = self.option('paneClass'),
      tab, pane, remote;

    if (typeof e === 'number') {
      tab = self.role('tab').eq(e);
    } else if (typeof e === 'string') {
      tab = self.role('tab').filter(function () {
        return this.hash === e;
      });
    } else {
      tab = $(e.currentTarget);
      if (self.option('preventDefault')) {
        e.preventDefault();
      }
    }

    tab.parent()
      .addClass(tabClass)
      .siblings((' ' + tabClass).replace(/\s+/g, '.'))
      .removeClass(tabClass);

    pane = self.role('pane').filter(tab.prop('hash'));

    if (pane.length === 0) {
      pane = $(tab.prop('hash'));
    }

    if (pane.length) {

      pane
        .addClass(paneClass)
        .siblings((' ' + paneClass).replace(/\s+/g, '.'))
        .removeClass(paneClass);

      remote = pane.data('remote');

      if (remote) {
        pane.removeData('remote');
        pane.load(remote);
      }
    }
    self.activeTab = tab;
    self.activePane = pane;

    self.fire('tab', tab, pane);
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
