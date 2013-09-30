// Generated by CoffeeScript 1.6.3
(function() {
  var Client, ProgressBar,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  console.log = function() {};

  $.fn.enable = function() {
    return this.removeAttr('disabled');
  };

  $.fn.disable = function() {
    return this.attr('disabled', 'disabled');
  };

  Client = (function() {
    Client.prototype.baseUrl = '/admin/djedi/cms/';

    function Client(baseUrl, uri) {
      this.baseUrl = baseUrl;
      this.uri = uri;
    }

    Client.prototype.URL = function(path) {
      return this.baseUrl + path;
    };

    Client.prototype.e = function(uri) {
      return encodeURIComponent(encodeURIComponent((uri || this.uri).valueOf()));
    };

    Client.prototype.AJAX = function(method, path, data, callback) {
      var response;
      if (callback != null) {
        return $.ajax({
          type: method,
          url: this.URL(path),
          data: data,
          success: function(data, textStatus, jqXHR) {
            return callback(data);
          }
        });
      } else {
        response = $.ajax({
          type: method,
          url: this.URL(path),
          data: data,
          async: false
        });
        if (response.status === 200) {
          return response.responseText;
        } else {
          return void 0;
        }
      }
    };

    Client.prototype.GET = function(path, callback) {
      return this.AJAX("GET", path, null, callback);
    };

    Client.prototype.GET_JSON = function(path, callback) {
      var r;
      if (callback != null) {
        return this.GET(path, callback);
      } else {
        if (r = this.GET(path)) {
          return JSON.parse(r);
        } else {
          return void 0;
        }
      }
    };

    Client.prototype.POST = function(path, data, callback) {
      return this.AJAX("POST", path, data, callback);
    };

    Client.prototype.PUT = function(path, data, callback) {
      return this.AJAX("PUT", path, data, callback);
    };

    Client.prototype.DELETE = function(path, callback) {
      return this.AJAX("DELETE", path, null, callback);
    };

    Client.prototype.get = function(uri, callback) {
      return this.GET_JSON("node/" + (this.e(uri)), callback);
    };

    Client.prototype.editor = function(uri, callback) {
      return this.GET("node/" + (this.e(uri)) + "/editor", callback);
    };

    Client.prototype.set = function(uri, data, callback) {
      var response;
      response = this.POST("node/" + (this.e(uri)), data, callback);
      if (!callback) {
        return JSON.parse(response);
      }
    };

    Client.prototype.publish = function(uri, callback) {
      return JSON.parse(this.PUT("node/" + (this.e(uri)) + "/publish", callback));
    };

    Client.prototype.revisions = function(uri, callback) {
      return this.GET_JSON("node/" + (this.e(uri)) + "/revisions", callback);
    };

    Client.prototype["delete"] = function(uri, callback) {
      return this.DELETE("node/" + (this.e(uri)), callback);
    };

    Client.prototype.load = function(uri, callback) {
      return this.GET_JSON("node/" + (this.e(uri)) + "/load", callback);
    };

    Client.prototype.render = function(ext, data, callback) {
      return this.POST("plugin/" + ext, data, callback);
    };

    return Client;

  })();

  ProgressBar = (function() {
    function ProgressBar(el) {
      this.$el = $(el);
      this.bar = this.$el.find('.progress-bar');
    }

    ProgressBar.prototype.show = function() {
      this.$el.addClass('active');
      return this.$el.show();
    };

    ProgressBar.prototype.hide = function() {
      this.$el.hide();
      return this.$el.removeClass('active');
    };

    ProgressBar.prototype.update = function(data) {
      var progress;
      progress = parseInt(data.loaded / data.total * 100, 10);
      return this.bar.css({
        width: progress + '%'
      });
    };

    return ProgressBar;

  })();

  window.Editor = (function() {
    function Editor(config) {
      this.config = config;
      this.discard = __bind(this.discard, this);
      this.publish = __bind(this.publish, this);
      this.loadRevision = __bind(this.loadRevision, this);
      this.onSave = __bind(this.onSave, this);
      this.onFormChange = __bind(this.onFormChange, this);
      this.onLoad = __bind(this.onLoad, this);
      this.initialize(this.config);
    }

    Editor.prototype.initialize = function(config) {
      this.api = new Client(window.DJEDI_ENDPOINT);
      this.$doc = $(document);
      this.actions = {
        discard: $('#button-discard'),
        save: $('#button-save'),
        publish: $('#button-publish')
      };
      this.$form = $('#form');
      this.progressbar = new ProgressBar('#progressbar');
      this.$plugin = $('header .plugin');
      this.$path = $('header .uri');
      this.$version = $('header .version');
      this.$flag = $('header .flag');
      $('#button-publish').on('click', this.publish);
      $('#button-discard').on('click', this.discard);
      this.$form.ajaxForm({
        beforeSubmit: this.prepareForm,
        success: this.onSave
      });
      $('#form input').on('change', this.onFormChange);
      $('#form textarea').on('change', this.onFormChange);
      $('#form select').on('change', this.onFormChange);
      this.$doc.on('form:change', this.onFormChange);
      this.$doc.ajaxStart(function() {
        return $('#spinner').toggleClass('icon-spin').show();
      });
      this.$doc.ajaxStop(function() {
        return $('#spinner').toggleClass('icon-spin').hide();
      });
      this.api.load(config.uri, this.onLoad);
      this.callback('initialize', config);
      return this.initialized = true;
    };

    Editor.prototype.callback = function() {
      var args, callback, name;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      callback = this.config[name];
      if (callback) {
        return callback.apply(this, args);
      }
    };

    Editor.prototype.delay = function(time, func) {
      return setTimeout(func, time);
    };

    Editor.prototype.trigger = function() {
      var eventType, params;
      eventType = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      console.log('Editor.trigger', eventType);
      return this.$doc.trigger(eventType, params);
    };

    Editor.prototype.triggerRender = function(content) {
      return this.trigger('node:render', this.node.uri.valueOf(), content);
    };

    Editor.prototype.prepareForm = function() {};

    Editor.prototype.onLoad = function(node) {
      var initial,
        _this = this;
      console.log('Editor.onLoad()', node.uri);
      initial = this.node === void 0;
      if (initial) {
        this.trigger('page:node:fetch', node.uri.valueOf(), function(node) {
          console.log('Editor.inititial data', node);
          return _this.initial = node;
        });
      }
      node = this.setNode(node);
      if (initial) {
        this.trigger('plugin:loaded', node.uri.valueOf());
      }
      this.render(node);
      this.delay(0, function() {
        return _this.trigger('node:render', node.uri.valueOf(), node.content || '');
      });
      return console.log('content', node.content || '');
    };

    Editor.prototype.onFormChange = function(event) {
      console.log('Editor.onFormChange()');
      this.setState('dirty');
      return this.callback('onFormChange', event);
    };

    Editor.prototype.onSave = function(node) {
      console.log('Editor.onSave()');
      node = this.setNode(node);
      this.render(node);
      return this.trigger('node:render', node.uri.valueOf(), node.content);
    };

    Editor.prototype.setNode = function(node) {
      var _this = this;
      console.log('Editor.setNode()');
      this.node = node;
      this.node.uri = node.uri.to_uri();
      if (node.uri.version === 'draft') {
        this.setState('draft');
      } else {
        if (!node.uri.version) {
          this.setState('new');
        } else {
          this.setState('published');
        }
      }
      if (this.node.data === null) {
        this.trigger('page:node:fetch', this.node.uri.valueOf(), function(node) {
          _this.node.data = node.data;
          return _this.node.content = _this.renderContent(node.data);
        });
      }
      this.renderHeader(this.node);
      this.renderRevisions();
      return this.node;
    };

    Editor.prototype.setState = function(state) {
      console.log('Editor.setState()', state);
      if (state !== this.state) {
        this.state = state;
        this.$version.removeClass('label-default label-warning label-danger label-info label-success');
        switch (state) {
          case 'new':
            this.$version.addClass('label-default');
            this.actions.discard.disable();
            this.actions.save.enable();
            return this.actions.publish.disable();
          case 'dirty':
            this.$version.addClass('label-danger');
            this.actions.discard.enable();
            this.actions.save.enable();
            return this.actions.publish.disable();
          case 'draft':
            this.$version.addClass('label-primary');
            this.actions.discard.enable();
            this.actions.save.disable();
            return this.actions.publish.enable();
          case 'published':
            this.$version.addClass('label-success');
            this.actions.discard.disable();
            this.actions.save.disable();
            return this.actions.publish.disable();
          case 'revert':
            this.$version.addClass('label-warning');
            this.actions.discard.disable();
            this.actions.save.disable();
            return this.actions.publish.enable();
        }
      }
    };

    Editor.prototype.renderHeader = function(node) {
      var color, lang, part, parts, path, uri, v;
      uri = node.uri;
      color = (uri.ext[0].toUpperCase().charCodeAt() - 65) % 5 + 1;
      parts = (function() {
        var _i, _len, _ref, _results;
        _ref = uri.path.split('/');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          part = _ref[_i];
          _results.push(part[0].toUpperCase() + part.slice(1));
        }
        return _results;
      })();
      path = parts.join(" <span class=\"plugin-fg-" + color + "\">/</span> ");
      if (uri.scheme === 'i18n') {
        lang = uri.namespace.split('-')[0];
      }
      this.$plugin.html(uri.ext).addClass("plugin-fg-" + color);
      this.$path.html(path);
      this.$flag.addClass("flag-" + lang);
      v = this.$version.find('var');
      v.html(this.versionLabel(uri.version));
      return this;
    };

    Editor.prototype.versionLabel = function(version) {
      if (!version) {
        return 'default';
      } else if (!isNaN(parseInt(version, 10))) {
        return "v" + version;
      } else {
        return version;
      }
    };

    Editor.prototype.renderRevisions = function() {
      var $li, $link, $menu, baseUri, published, uri, _i, _len, _ref, _ref1;
      console.log('Editor.renderRevisions()');
      baseUri = this.node.uri.valueOf().to_uri();
      baseUri.version = null;
      baseUri = baseUri.valueOf();
      this.revisions = this.api.revisions(baseUri.valueOf());
      $('#revisions a').off('click');
      $menu = $('#revisions').empty();
      if (this.initial != null) {
        this.revisions.splice(0, 0, [baseUri, false]);
      }
      _ref = this.revisions;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], uri = _ref1[0], published = _ref1[1];
        uri = uri.to_uri();
        $li = $('<li>');
        $link = $("<a href=\"#\">" + (this.versionLabel(uri.version)) + "</a>");
        $link.data({
          'uri': uri,
          'published': published
        });
        if (published) {
          $li.addClass('published');
          $link.append(' <i class=\"icon-cloud\"></i>');
        } else if (uri.version === 'draft') {
          $li.addClass('draft');
        }
        $li.append($link);
        $menu.append($li);
      }
      return $('#revisions a').on('click', this.loadRevision);
    };

    Editor.prototype.render = function(node) {
      console.log('Editor.render()');
      return this.callback('render', node);
    };

    Editor.prototype.loadRevision = function(event) {
      var $revision, data, published, uri,
        _this = this;
      console.log('Editor.loadRevision()');
      event.preventDefault();
      $revision = $(event.target);
      uri = $revision.data('uri');
      published = $revision.data('published');
      if (uri.version) {
        return this.api.load(uri.valueOf(), function(node) {
          _this.onLoad(node);
          if (!published && _this.node.uri.version !== 'draft') {
            return _this.setState('revert');
          }
        });
      } else {
        data = this.initial.data || '';
        return this.renderContent(data, function(content) {
          _this.trigger('node:render', _this.node.uri.valueOf(), content);
          _this.node.uri = uri.valueOf();
          _this.node.data = data;
          _this.node.content = content;
          return _this.onLoad(_this.node);
        });
      }
    };

    Editor.prototype.renderContent = function(data, callback) {
      var content, plugin,
        _this = this;
      console.log('Editor.renderContent()');
      plugin = this.node.uri.ext;
      if (typeof data === 'string') {
        data = {
          data: data
        };
      }
      content = '';
      if (callback) {
        this.api.render(plugin, data, function(content) {
          if (callback) {
            return callback(content);
          }
        });
      } else {
        content = this.api.render(plugin, data);
      }
      return content;
    };

    Editor.prototype.publish = function() {
      var node;
      node = this.api.publish(this.node.uri.valueOf());
      this.setNode(node);
      return this.setState('published');
    };

    Editor.prototype.discard = function() {
      var uri;
      if (this.node.uri.version === 'draft') {
        this.api["delete"](this.node.uri.valueOf());
      }
      uri = this.node.uri;
      uri.version = null;
      this.node = null;
      return this.api.load(uri.valueOf(), this.onLoad);
    };

    return Editor;

  })();

}).call(this);
