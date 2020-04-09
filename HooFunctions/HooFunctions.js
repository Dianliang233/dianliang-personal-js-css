/*
* Some JS functions
* [[m:User:Hoo man]]; Version 2.0.1-RC1; 2019-10-16;
* PLEASE DO NOT COPY AND PASTE
*/

if(typeof(hoo) === 'undefined') {
	var hoo = {};
}
if(typeof(hoo.dom) === 'undefined') {
	hoo.dom = {};
}
if(typeof(hoo.instances) === 'undefined') {
	hoo.instances = {};
}
/*global mw, hooConfig, ActiveXObject, hoofrConfig */
/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, jquery:true, indent:4, maxerr:50, loopfunc:true, white:false */

hoo.http = function() {
	"use strict";
	if(window.XMLHttpRequest) {
		return new XMLHttpRequest();
	}else if(window.ActiveXObject) {
		return new ActiveXObject('Microsoft.XMLHTTP');
	}
};

mw.loader.using(['mediawiki.util', 'user.options', 'jquery.client'], function() {
	"use strict";
	//this function will be run after all dependencies are there, the whole script has been parsed and the document is ready
	hoo.main = function() {
		//wiki information
		var langCode, wikiCode, tmp, i;
		if(mw.config.get('wgServer').indexOf('secure.wikimedia') === -1) {
			tmp = mw.config.get('wgServer').split('.');
			langCode = tmp[0].replace(/(https?)?\/\//, '');
			wikiCode = tmp[1];
		}else{
			//the following is a bit tricky, cause it's quite hard to find out on which wiki we are from secure.wikimedia.org
			//deprecated very(?) soon :)
			tmp = mw.config.get('wgScriptPath').split('/');
			langCode = tmp[2];
			wikiCode = tmp[1];
			//some /wikipedia/ projects on secure are on $1.wikimedia.org... I really hope the following gets at least most of them
			if(wikiCode === 'wikipedia' && langCode.length > 3 && langCode !== 'test' && langCode !== 'test2' && langCode !== 'simple' && langCode !== 'minnan' && langCode.indexOf('-') === -1) {
				wikiCode = 'wikimedia';	
			}
		}
		mw.config.set( { 'wgWikiName' : langCode, 'wgWikiFamily' : wikiCode } );
		//will start scripts that depend on functions in here
		//hoo_callbacks is deprecated
		if(typeof(window.hoo_callbacks) === 'object' || typeof(this.load) === 'object') {
			if(typeof(window.hoo_callbacks) === 'object' && typeof(this.load) === 'object') {
				this.load = this.load.concat( window.hoo_callbacks );
				window.hoo_callbacks = undefined;
			}else if(typeof(window.hoo_callbacks) === 'object') {
				this.load = window.hoo_callbacks;
				window.hoo_callbacks = undefined;
			}
			for(i=0; i<this.load.length; i++) {
				setTimeout(this.load[i], 1);
				this.load[i] = undefined;
			}
			this.load = undefined;
		}
	};
	//this can show an animation while eg. data gets transfered
	hoo.showProcess = function() {
		if(!this.dom.inProcess) {
			this.dom.inProcess = document.createElement('div');
			this.dom.inProcess.id = 'inProcess';
			this.dom.inProcess.className = 'inProcess';
			this.dom.inProcess.innerHTML = mw.html.element('img', {'src' : mw.config.get('stylepath') + '/common/images/ajax-loader.gif'});
			document.getElementsByTagName('body')[0].appendChild(this.dom.inProcess);
		}else{
			this.dom.inProcess.style.display = '';
		}
	};
	//this will stop that animation
	hoo.stopProcess = function() {
		if(this.dom.inProcess) {
			this.dom.inProcess.style.display = 'none';
		}else{
			throw new Error('You need to run hoo.showProcess() before hoo.stopProcess()');
		}
	};
	//add tool links (in p-personal) or using mw.util.addPortletLink()
	//target can be either a link or a function
	hoo.addToolLink = function(name, target, id, method) {
		var link, onClickFunc;
		var h = mw.html;
		if(!method) {
			method = this.config.toolLinkMethod;
		}
		if(method === 'toolbar' && !(mw.user.options.get('skin') === 'monobook' || mw.user.options.get('skin') === 'vector' )) {
			//toolbar is only (well) working in monobook and vector, so we have to use smth. else on other skins
			method = 'p-cactions';
		}
		if(!id) {
			id = 'tool_link_' + (Math.ceil(Math.random()*1000));
		}
		if(typeof(target) === 'function') {
			onClickFunc = target;
			target = '#';
		}
		if(method === 'toolbar') {
			link = document.createElement('li');
			link.className = 'toolink_entry';
			link.innerHTML = h.element('a', {'class' : 'toolinks', 'id' : id, 'href' : target}, name);
			if(!this.dom.toolLinks || !document.getElementById('toolLinks')) {
				this.dom.toolLinks = document.createElement('div');
				this.dom.toolLinks.id = 'toolLinks';
				this.dom.toolLinks.innerHTML = '<ul></ul>';
				document.getElementById('p-personal').appendChild(this.dom.toolLinks);
				//move the original p-personal back right
				mw.util.addCSS('#p-personal ul { float: right; }');
				if($.client.profile().name === 'msie' && $.client.profile().versionBase < 9) {
					//IE workaround
					mw.util.addCSS('.toolLinkSubRow { max-width: 120px; } #toolLinks { margin-right : 80px; }');
				}
			}
			this.dom.toolLinks.getElementsByTagName('ul')[0].appendChild(link);
		}else{
			mw.util.addPortletLink(method, target, name, id);
		}
		if(onClickFunc) {
			$('#' + id).on('click', onClickFunc);
		}
		return id;
	};
	//this function can add a sub link to links added with hoo.addToolLink (of course only where method = toolbar)
	//target can be either a link or a function
	hoo.addSubLink = function(parentId, name, target, id) {
		if($.client.profile().name === 'msie' && $.client.profile().versionBase < 8) {
			//don't even try it in IE prior to version 8
			return false;
		}
		var tmp, onClickFunc;
		var h = mw.html;
		if(typeof(target) === 'function') {
			onClickFunc = target;
			target = '#';
		}
		//to make it wrap where needed make sure we got a breaking character at least every 14 chars
		tmp = name.match(/([^ ]){14,}/g);
		if(tmp) {
			for(var i=0;i<tmp.length; i++) {
				name = name.replace(tmp[i], tmp[i].substring(0, 14) + '&#8203;' + tmp[i].substring(14));
			}
		}
		if(!this.dom[parentId]) {
			try {
				document.getElementById(parentId).firstChild.nodeValue = '▼ ' + document.getElementById(parentId).firstChild.nodeValue;
				this.dom[parentId] = document.getElementById(parentId).parentNode;
			}catch(e){
				throw new Error('The given parentId has to be a link set with hoo.addToolLink and method = toolbar');
			}
		}
		if(!id) {
			id = 'tool_link_' + (Math.ceil(Math.random()*1000));
		}
		if(this.dom[parentId].getElementsByTagName('ul').length === 0) {
			var wrapperId;
			tmp = document.createElement('ul');
			tmp.className = 'toolLinkSubField';
			tmp.style.display = 'none';
			wrapperId = 'toolLinkSubField' + (Math.ceil(Math.random()*1000));
			tmp.id = wrapperId;
			this.dom[parentId].onmouseover = function() { document.getElementById(wrapperId).style.display = 'block'; };
			this.dom[parentId].onmouseout = function() { document.getElementById(wrapperId).style.display = 'none'; };
			this.dom[parentId].appendChild(tmp);
		}
		tmp = document.createElement('li');
		tmp.className = 'toolLinkSubRow';
		tmp.innerHTML = '•&nbsp;' + h.element('a', {'class' : 'toolinks', 'id' : id, 'href' : target});
		this.dom[parentId].getElementsByTagName('ul')[0].appendChild(tmp);
		//add name as raw HTML to preserve 
		$('#' + id).html( name );
		if(onClickFunc) {
			$('#' + id).on('click', onClickFunc);
		}
		return id;
	};
	//this function can do several things with two objects (method):
	//add: add the second object to the first one (no overwrite, recursive)
	//put: like add, but not recursive
	hoo.objectDiff = function(firstObject, secondObject, method) {
		if(!method) {
			method = 'add';
		}
		if(typeof(firstObject) === 'undefined') {
			return secondObject;
		}
		var i;
		if(method === 'add') {
			for(i in secondObject) {
				if(typeof(firstObject[i]) === 'undefined') {
					firstObject[i] = secondObject[i];
				}else if(typeof(secondObject[i]) === 'object') {
					//recursive
					firstObject[i] = this.objectDiff(firstObject[i], secondObject[i]);
				}
			}
			return firstObject;
		}else if(method === 'put') {
			for(i in secondObject) {
				if(typeof(firstObject[i]) === 'undefined') {
					firstObject[i] = secondObject[i];
				}
			}
			return firstObject;
		}
	};
	//for localization, assuming defaultLang is already loaded
	hoo.loadLocalization = function(lang, path, callback, availableLangs, defaultLang) {
		if(lang !== defaultLang) {
			if($.inArray(lang, availableLangs)) {
				$.ajax({
					url: path.replace('$1', encodeURIComponent(lang)),
					dataType: 'script',
					cache: true,
					success: callback
				});
				return;
			}
		}
		//not avaiable
		setTimeout(callback, 1);
	};
	//creates a movable popup
	hoo.popup = function(id, width, height, title) {
		this.dragObjekt = {};
		//as javascript hardly supports passing objects to statehandlers we need that workaround
		//and to not always redefine those functions we got them here
		this.pointer = {
			close : (function (self) { return function(event) { self.close(event); }; })(this),
			dragInit : (function (self) { return function(event) { self.dragInit(event); }; })(this),
			dragMove : (function (self) { return function(event) { self.dragMove(event); }; })(this),
			resizeInit : (function (self) { return function(event) { self.resizeInit(event); }; })(this),
			resizeDo : (function (self) { return function(event) { self.resizeDo(event); }; })(this),
			stop : (function (self) { return function() { self.stop(); }; })(this)
		};
		this.addButton = function(buttonName, buttonOnClick, buttonTitle, buttonId) {
			var id = this.dragObjekt.id;
			hoo.dom[id].button = document.createElement('button');
			hoo.dom[id].button.className = 'popupButton';
			hoo.dom[id].button.setAttribute('type', 'button');
			if(buttonTitle) {
				hoo.dom[id].button.title = buttonTitle;
			}
			if(buttonId) {
				hoo.dom[id].button.id = buttonId;
			}
			hoo.dom[id].button.innerHTML = buttonName;
			if(typeof(buttonOnClick) !== 'function') {
				throw new Error('buttonOnClick needs to be a function');
			}
			$(hoo.dom[id].button).on('click', buttonOnClick);
			hoo.dom[id].buttonArea.appendChild(hoo.dom[id].button);
		};
		var origId = id;
		if(!id || !width || !height || !title) {
			throw new Error('Not enough arguments given.');
		}
		id = 'popup_' + id;	//to make sure this wont collide with other objects
		this.dragObjekt.id = id;
		if(!hoo.dom[id]) {
			hoo.dom[id] = {};
			hoo.dom[id].wrapper = document.createElement('div');
			hoo.dom[id].wrapper.id = origId;
			hoo.dom[id].wrapper.className = 'popupWrapper';
			//width and margin from the left side
			hoo.dom[id].wrapper.style.width = (width + 16) + 'px';
			hoo.dom[id].wrapper.style.left = (($(window).width() / 2) - (width / 2)) + 'px';
			//height and margin from the top
			hoo.dom[id].wrapper.style.height = (height + 70) + 'px';
			hoo.dom[id].wrapper.style.top = (($(window).height() / 2) - (height / 2)) + 'px';
			//resize thingy (lower right and bottom)
			hoo.dom[id].resizeAreaRight = document.createElement('div');
			hoo.dom[id].resizeAreaRight.className = 'popupWindowResizeArea popupWindowResizeAreaRight';
			hoo.dom[id].resizeAreaBottom = document.createElement('div');
			hoo.dom[id].resizeAreaBottom.className = 'popupWindowResizeArea popupWindowResizeAreaBottom';
			$(hoo.dom[id].resizeAreaRight).on('mousedown', this.pointer.resizeInit);
			$(hoo.dom[id].resizeAreaBottom).on('mousedown', this.pointer.resizeInit);
			document.getElementsByTagName('body')[0].appendChild(hoo.dom[id].wrapper);
			hoo.dom[id].wrapper.appendChild(hoo.dom[id].resizeAreaRight);
			hoo.dom[id].wrapper.appendChild(hoo.dom[id].resizeAreaBottom);
			//titlebar
			hoo.dom[id].titleBar = document.createElement('div');
			hoo.dom[id].titleBar.id = origId + 'TitleBar';
			hoo.dom[id].titleBar.className = 'popupTitleBar';
			hoo.dom[id].titleBarContent = document.createElement('span');
			hoo.dom[id].titleBarContent.className = 'popupTitleBarContent';
			hoo.dom[id].titleBarContent.innerHTML = title;
			hoo.dom[id].titleBar.appendChild(hoo.dom[id].titleBarContent);
			//close X
			hoo.dom[id].windowClose = document.createElement('span');
			hoo.dom[id].windowClose.className = 'popupWindowClose';
			$(hoo.dom[id].windowClose).on('click', this.pointer.close);
			hoo.dom[id].windowClose.innerHTML = 'X';
			hoo.dom[id].titleBar.appendChild(hoo.dom[id].windowClose);
			$(hoo.dom[id].titleBar).on('mousedown', this.pointer.dragInit);
			hoo.dom[id].wrapper.appendChild(hoo.dom[id].titleBar);
			//content container
			hoo.dom[id].container = document.createElement('div');
			hoo.dom[id].container.id = origId + 'Container';
			hoo.dom[id].container.className = 'popupContainer';
			hoo.dom[id].container.style.width = width + 'px';
			hoo.dom[id].container.style.height = height + 'px';
			hoo.dom[id].wrapper.appendChild(hoo.dom[id].container);
			//close button
			hoo.dom[id].buttonArea = document.createElement('div');
			hoo.dom[id].buttonArea.id = origId + 'ButtonArea';
			hoo.dom[id].buttonArea.className = 'popupButtonArea';
			hoo.dom[id].wrapper.appendChild(hoo.dom[id].buttonArea);
			this.addButton(mw.message('hoo-closeButtonText').escaped(), this.pointer.close);
			//IE 7/6 workaround
			if($.client.profile().name === 'msie' && $.client.profile().versionBase < 8) {
				hoo.dom[id].titleBar.style.marginLeft = '-15px';
				hoo.dom[id].container.style.paddingTop = '30px';
				mw.util.addCSS('.popupButton { overflow: visible; }');
			}
		}else{
			hoo.dom[this.dragObjekt.id].wrapper.style.display = 'block';
		}
		this.close = function() {
			hoo.dom[this.dragObjekt.id].wrapper.style.display = 'none';
		};
		this.reOpen = function() {
			hoo.dom[this.dragObjekt.id].wrapper.style.display = 'block';
		};
		//if html == string: this function will either 'replace' (the existing HTML), 'prepend' or 'append' the given html
		//if html == object: this function will append the given object to the container
		this.containerHTML = function(html, mode) {
			if(!mode) {
				mode = 'replace';
			}
			if(typeof(html) === 'string') {
				if(mode === 'append') {
					hoo.dom[this.dragObjekt.id].container.innerHTML += html;
				}else if(mode === 'prepend') {
					hoo.dom[this.dragObjekt.id].container.innerHTML = html + hoo.dom[this.dragObjekt.id].container.innerHTML;
				}else{
					hoo.dom[this.dragObjekt.id].container.innerHTML = html;
				}
			}else{
				try {
					hoo.dom[this.dragObjekt.id].container.appendChild(html);
				} catch(e) {
					throw new Error('Couldn\'t append the given object.');
				}
			}
		};
		this.dragInit = function(event) {
			event.preventDefault();
			var x, y;
			id = this.dragObjekt.id;
		
			//get cursor position
			x = event.pageX;
			y = event.pageY;
			
			this.dragObjekt.cursorStartX = x;
			this.dragObjekt.cursorStartY = y;
			this.dragObjekt.startLeft = parseInt(hoo.dom[id].wrapper.style.left, 10);
			this.dragObjekt.startTop = parseInt(hoo.dom[id].wrapper.style.top, 10);

			if(isNaN(this.dragObjekt.startLeft)) {
				this.dragObjekt.startLeft = 0;
			}
			if(isNaN(this.dragObjekt.startTop)) {
				this.dragObjekt.startTop = 0;
			}
			//get all mousemove on the page and abort move an mouseup
			$(document).on('mousemove', this.pointer.dragMove);
			$(document).on('mouseup', this.pointer.stop);
		};
		this.dragMove = function(event) {
			event.preventDefault();
			var x, y;
			var id = this.dragObjekt.id;
			
			x = event.pageX;
			y = event.pageY;
			//Move it
			hoo.dom[id].wrapper.style.left = (this.dragObjekt.startLeft + x - this.dragObjekt.cursorStartX) + 'px';
			hoo.dom[id].wrapper.style.top = (this.dragObjekt.startTop + y - this.dragObjekt.cursorStartY) + 'px';
		};
		this.resizeInit = function(event) {
			event.preventDefault();
			var x, y;
			id = this.dragObjekt.id;
			//get cursor position
			x = event.pageX;
			y = event.pageY;
			this.dragObjekt.cursorStartX = x;
			this.dragObjekt.cursorStartY = y;
			
			this.dragObjekt.wrapperOldWidth = parseInt(hoo.dom[id].wrapper.style.width, 10);
			this.dragObjekt.wrapperOldHeight = parseInt(hoo.dom[id].wrapper.style.height, 10);
			this.dragObjekt.containerOldHeight = parseInt(hoo.dom[id].container.style.height, 10);
			this.dragObjekt.containerOldWidth = parseInt(hoo.dom[id].container.style.width, 10);

			//get all mousemoves on the page and abort move an mouseup
			$(document).on('mousemove', this.pointer.resizeDo);
			$(document).on('mouseup', this.pointer.stop);
		};
		this.resizeDo = function(event) {
			event.preventDefault();
			var x, y;
			var id = this.dragObjekt.id;
			x = event.pageX;
			y = event.pageY;
			//Resize it
			hoo.dom[id].wrapper.style.width = (this.dragObjekt.wrapperOldWidth + x - this.dragObjekt.cursorStartX) + 'px';
			hoo.dom[id].wrapper.style.height = (this.dragObjekt.wrapperOldHeight + y - this.dragObjekt.cursorStartY) + 'px';
			
			hoo.dom[id].container.style.width = (this.dragObjekt.containerOldWidth + x - this.dragObjekt.cursorStartX) + 'px';
			hoo.dom[id].container.style.height = (this.dragObjekt.containerOldHeight + y - this.dragObjekt.cursorStartY) + 'px';
		};
		this.stop = function() {
			//remove eventlisteners
			$(document).off('mousemove', this.pointer.dragMove);
			$(document).off('mousemove', this.pointer.resizeDo);
			$(document).off('mouseup', this.pointer.stop);
		};
	};
	hoo.isInGroup = function(group) {
		return ($.inArray(group, mw.config.get('wgUserGroups')) !== -1);
	};
	hoo.isInGlobalGroup = function(group) {
		return (mw.config.exists('wgGlobalGroups') &&  $.inArray(group, mw.config.get('wgGlobalGroups')) !== -1);
	};

	//MediaWiki API related functions

	if(typeof(hoo.api) === 'undefined') {
		hoo.api = {sync : {}, async : {}};
	}

	//synchronous functions

	hoo.api.sync.request = function(type, params, returnXml, baseURI) {
		var i;
		if(!baseURI) {
			baseURI = mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/api.php';
		}
		var data = '';
		if(!params.format) {
			params.format = 'xml';
		}
		for(i in params) {
			if(typeof(params[i]) === 'string' || typeof(params[i]) === 'number') {
				data += '&' + encodeURIComponent(i) + '=' + encodeURIComponent(params[i]);
			}else if(typeof(params[i]) === 'boolean' && params[i]) {
				data += '&' + encodeURIComponent(i) + '=1';
			}
		}
		var http = hoo.http();
		if(type === 'POST') {
			http.open('POST', baseURI, false);
			http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
			http.setRequestHeader('Content-length', data.length);
			http.setRequestHeader('Connection', 'close');
			//send it
			http.send(data.replace('&', ''));
		}else{
			http.open('GET', baseURI + data.replace('&', '?'), false);
			http.send(null);
		}
		if(http.readyState === 4 && http.status === 200) {
			// success ;-)
			if(returnXml) {
				return http.responseXML;
			}
			return http.responseText;
		}else{
			return false;
		}
	};
	hoo.api.sync.getPage = function(params) {
		params.action = 'raw';
		return hoo.api.sync.request('GET', params, false, mw.config.get('wgServer') + mw.config.get('wgScript'));
	};
	hoo.api.sync.getToken = function(type, pages, returnLastRevision) {
		if(type === 'delete') {
			//the delete token is equal to the edit one
			type = 'edit';
		}
		//type must be either delete or edit
		var params = {'action' : 'query', 'intoken' : type, 'titles' : pages, 'format' : 'json', 'indexpageids' : true};
		if(!returnLastRevision) {
			//http://www.mediawiki.org/wiki/ResourceLoader/Default_modules#tokens
			if(type === 'edit') {
				return mw.user.tokens.get('csrfToken');
			}
			params.prop = 'info';
		}else{
			params.prop = 'info|revisions';
		}
		var json = hoo.api.sync.request('GET', params);
		if(!json) {
			return false;
		}
		return $.parseJSON(json).query;
	};
	hoo.api.sync.hasRight = function(right) {
		if(!mw.user.options.exists('userRights')) {
			var params = {'action' : 'query', 'meta' : 'userinfo', 'uiprop' : 'rights', 'format' : 'json'};
			try {
				mw.user.options.set('userRights', $.parseJSON(hoo.api.sync.request('GET', params)).query.userinfo.rights);
			}catch(e) {
				return false;
			}
		}
		return ($.inArray(right, mw.user.options.get('userRights')) !== -1);
	};
	//this will return true on success and either false or a string with the error in case of an error occured
	hoo.api.sync.edit = function(pageName, params) {
		//build the (post) request
		if(!params.token) {
			params.token = this.getToken('edit', pageName);
		}
		params.action = 'edit';
		params.title = pageName;
		params.format = 'json';
		var json = $.parseJSON( hoo.api.sync.request('POST', params) );
		if(json) {
			// success!?
			var result;
			if(json.edit) {
				//success!
				result = json.edit.result;
			}else{
				//something went wrong :(
				result = json.error.info;
			}
			if(result === 'Success') {
				return true;
			}else{
				return result;
			}
		}else{
			return false;
		}
	};
	hoo.api.sync.deletePage = function(pageName, params) {
		//build the (post) request
		if(!params) {
			params = {};
		}
		if(!params.token) {
			params.token = this.getToken('delete', pageName);
		}
		params.action = 'delete';
		params.format = 'json';
		params.title = pageName;
		//send it
		var json = $.parseJSON( hoo.api.sync.request('POST', params) );
		if(json && json['delete']) {
			// success!?
			return true;
		}else if(json && json.error){
			return json.error.info;
		}
		return false;
	};

	//asynchronous functions (can be called exactly as the above functions, but the first argument must be a callback function which will then get the return value as argument)
	//all async functions are available as sync functions as well (despite some async.remote ones which can't work synchronous), but not all sync functions as async

	hoo.api.async.hasRight = function(callback, right) {
		if(!mw.user.options.exists('userRights')) {
			var url = mw.config.get('wgServer') + mw.config.get('wgScriptPath') + '/api.php?action=query&meta=userinfo&uiprop=rights&format=json';
			var http = hoo.http();
			http.open('GET', url, true);
			http.send(null);
			http.onreadystatechange = function() {
				if(http.readyState === 4 && http.status === 200) {
					// success ;-)
					mw.user.options.set('userRights', $.parseJSON(http.responseText).query.userinfo.rights);
					callback(($.inArray(right, mw.user.options.get('userRights')) !== -1));
					return;
				}
			};
		}else{
			callback(($.inArray(right, mw.user.options.get('userRights')) !== -1));
			return;
		}
	};

	//(default) lang

	//hoo.popup close button text
	if(!mw.messages.exists('hoo-closeButtonText')) {
		mw.messages.set('hoo-closeButtonText', 'Close');
	}

	//default config
	//to change anything just add one of the following lines to your own .js and replace 'hoo.defaultConfig' with 'hooConfig'

	if(typeof(hoo.defaultConfig) === 'undefined') {
		hoo.defaultConfig = {};
	}

	hoo.defaultConfig.globalCssUrl = '//meta.wikimedia.org/w/index.php?title=User:Hoo_man/tool.css&action=raw&ctype=text/css';

	//must be either "toolbar" or "p-cactions", "p-personal", "p-navigation", "p-tb", ...
	hoo.defaultConfig.toolLinkMethod = 'toolbar';

	//the language to use, defaults to wgUserLanguage
	hoo.defaultConfig.lang = mw.config.get('wgUserLanguage');

	if(typeof(hooConfig) === 'undefined') {
		if(typeof(hoofrConfig) === 'undefined') {
			hoo.config = hoo.defaultConfig;
		}else{
			//fallback to the old hoofrConfig
			hoo.config = hoo.objectDiff(hoofrConfig, hoo.defaultConfig);
		}
	}else{
		hoo.config = hoo.objectDiff(hooConfig, hoo.defaultConfig);
	}

	mw.loader.load(hoo.config.globalCssUrl, 'text/css');

	$(document).ready( (function (self) { return function() { self.main(); }; })(hoo) );
});