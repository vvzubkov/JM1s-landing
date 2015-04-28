function H8VideoModule(_showStats) {
    var _this = this;
    var _shFactor = 14;
    //
    var _container = document.getElementById('H8ScrollContainer');
    var _windowY, _pageOffset, _localY, _areaScrolled;
    var _sideMenu = new H8SideMenu();
    var _videosContainer = document.getElementById("H8VideoContainer");
    var _video = document.getElementById("H8Video");
    var _gesturesContainer = document.getElementById('contentspots_1_AnchorDiv');
    H8._bgVideo = _video;
    var _maskY = 0, _pScroll = 0, _circleRadius = 0, _targetRadius = 0, _videoW = 0, _videoH = 0, _videoOffsetX = 0, _videoOffsetY = 0, _videoTimer = 0;
    _this._r = 0;
    //Defines intervals for scrolling
    var _isRunning = false, _inView = false, _animMask = false, _imgWasSet = false, _isFixed = true, _isCanvasFixed = false, _videoHasPlayed = false, _videoIsPlaying = false, _restartVideoWhenScrollUp = false, _waitForVideoRestart = false;
    //Define break points for scrolling
    var _bpVideo = [9.5, 20, 37.5, 1000]; //Positions (in miliseconds) to pause video
    //var _bpVideo = [2.5, 16.5, 20, 1000]; //Positions (in miliseconds) to pause video
    var _bpOverlays = [3.5, 7, 10.5, 12.5]; //Start, stop from, stop to, start
    var _curVideoID = 0; //Which video section is currently playing
    //Create video overlays
    var _vo = document.querySelectorAll('.H8VideoOverlay');
    var _videoOverlays = [];
    var _numOverlays = _vo.length;
    for (var i = 0; i < _numOverlays; i++) _videoOverlays.push(new H8VideoOverlay(i, _vo[i], _bpOverlays[i]));
    H8._scrollIcon = new scrollIcon();
    H8._docuScroller = new docuScroll();

    if (!H8._isTouch && H8._isIEVersion > 8) {
        //jQuery(document).scroll(manageEngine);
        H8Events(window, "scroll", manageEngine, true);
        //Change preload value in video
        _video.preload = "auto";
        H8Events(_video, 'ended', videoEnded, true);
        _sideMenu.init();
        for (i = 0; i < _numOverlays; i++) _videoOverlays[i].init();
    }
    else {
        //Setup mobile (and old browsers)
        _videosContainer.style.position = "relative";
        _videosContainer.style.visibility = "visible";
        //Show video play button (don't preload anything)
        _video.preload = "auto";
        _video.controls = "controls";
        _video.poster = H8getImg("poster.jpg");
        _sideMenu.simpleVersion();
        for (i = 0; i < _numOverlays; i++) _videoOverlays[i].simpleVersion();
        _container.style.height = "auto";
        _container.style.paddingBottom = "100px";
        _container.style.backgroundColor = "#00101b";
        _this.resize = function () {
            if (H8._isIEVersion == 8) return;
            var _sw = window.innerWidth - 60;
            _video.style.width = _sw + "px";
            _video.style.height = Math.ceil(_sw / (16 / 9)) + "px";
        }
        H8Events(window, "resize", _this.resize, true);
        return;
    }
    var _videoCanvas = document.getElementById("H8VideoCanvas");
    var _videoCxt = _videoCanvas.getContext("2d");

    //Manage starting and stopping engine
    function manageEngine(e) {
        //_windowY = document.body.scrollTop;
        _windowY = jQuery(window).scrollTop();
        _localY = _windowY - _pageOffset;
        /*console.log("Window y: " + _windowY);
         console.log("Offset for module: " + _pageOffset);
         console.log("Local y: " + _localY);*/
        if (_windowY >= _pageOffset - _sh && _localY < _pageH - _topMargin) _inView = true;
        else _inView = false;
        if (_isRunning) {
            //Check for out of screen and kill engine
            if (!_inView) {
                //console.log("Kill engine");
                _isRunning = false;
                TweenLite.ticker.removeEventListener('tick', engine);
                clearInterval(_videoTimer);
                //Check that video is NOT fixed
                if (_isCanvasFixed) engine(null);
            }
        }
        else {
            //Check for inside screen and start engine
            if (_inView) {
                //console.log("Start engine");
                _isRunning = true;
                TweenLite.ticker.addEventListener('tick', engine);
                clearInterval(_videoTimer);
                _videoTimer = setInterval(checkVideoTime, 250);
            }
        }
    }

    var _curTime = 0, _yOnScrollerInit = 0;

    function checkVideoTime() {
        if (_restartVideoWhenScrollUp) {
            if (_yOnScrollerInit > _windowY && _isFixed) {
                //console.log("RESTART");
                _restartVideoWhenScrollUp = _waitForVideoRestart = false;
                playVideo(0, true);
            }
            else _yOnScrollerInit = _windowY;
        }
        if (!_isCanvasFixed || _waitForVideoRestart) return;
        _curTime = _video.currentTime;
        if (_curTime == undefined) _curTime = 0;
        //console.log("Video time: " + _curTime);
        //Check for finishing current part of video
        if ((_bpVideo[_curVideoID] - 1) <= _curTime) {
            //Scroll to text area
            H8._docuScroller.scrollToText(_videoOverlays[_curVideoID]._scrollOffset + _pageOffset - _realSh, false, 2, (_curVideoID == _numOverlays - 1));
            _curVideoID++;
            //Ready for next breakpoint
            if (_curVideoID > _numOverlays - 2) {
                _waitForVideoRestart = true;
                _curVideoID = 0;
            }
        }
    }

    _this.scrollToText = function (_id) {
        H8._docuScroller.scrollToText(_videoOverlays[_id]._scrollOffset + _pageOffset - _realSh, true, 1, (_id == _numOverlays - 1));
    }

    //Manage positioning while module is in view
    function engine(e) {
        //Calculate percentage of screen height we have scrolled in this module. Values are from 0-(_shFactor+1)
        _areaScrolled = (_localY + _realSh) / _pageH * _shFactor;
        if (_areaScrolled < 0) _areaScrolled = 0;
        //console.log("Local y: " + _localY);
        //console.log("Percent scrolled in module: " + _areaScrolled);
        //0-1 are when anim in, _shFactor - (_shFactor+1) are when anim out.

        //Manage videos
        //ANIM IN
        if (_areaScrolled < 1) {
            _animMask = true;
            _maskY = _sh * .5;
            _circleRadius += (Math.max(_sh * .25, (_areaScrolled * .5) * _sh) - _circleRadius) * .2;
            if (_isCanvasFixed) unfixCanvas(0);
            if (_isFixed) unfixVideos();
        }
        //ANIM OUT
        else if (_areaScrolled > _shFactor) {
            _animMask = true;
            _maskY = _sh * .5;
            _circleRadius += (Math.max(_sh * .25, (((_shFactor + 1) - _areaScrolled) * .5) * _sh) - _circleRadius) * .2;
            if (_isCanvasFixed) unfixCanvas(_pageH - _realSh);
            if (_isFixed) unfixVideos();
        }
        else {
            _animMask = false;
            if (_areaScrolled >= 1 && !_isCanvasFixed) fixCanvas();
        }
        _pScroll = (_areaScrolled - 1) / (_shFactor - 1);
        //console.log(_pScroll);
        //Mask or sidemenu
        if (_animMask) updateMask(_maskY);
        else _sideMenu.progress(_pScroll);
        //Video overlays
        for (var i = 0; i < _numOverlays; i++) _videoOverlays[i].move(_areaScrolled, _realSh, _topMargin);
    }

    function fixCanvas() {
        _isCanvasFixed = true;
        _videoCanvas.style.position = "fixed";
        _videoCanvas.style.marginTop = _topMargin + "px";
        //Anim in entire mask
        _this._r = _circleRadius;
        TweenLite.killTweensOf(_this);
        TweenLite.to(_this, .6, {
            _r: _targetRadius * .5,
            onUpdate: animInMask,
            ease: Quad.easeOut,
            onComplete: fixVideos
        });
        //Show sidemenu
        _sideMenu.show();
        //Start playing video
        playVideo(0, true);
    }

    function unfixCanvas(_m) {
        _isCanvasFixed = false;
        TweenLite.killTweensOf(_this);
        updateMask(_sh * .5);
        _videoCanvas.style.position = "absolute";
        _videoCanvas.style.marginTop = _m + "px";
        //Pause video
        playVideo(0, false);
        //Hide sidemenu and scroll icon
        _sideMenu.hide();
        H8._scrollIcon.animOut();
    }

    function animInMask() {
        _circleRadius = _this._r;
        updateMask(_sh * .5);
    }

    function fixVideos() {
        //Show entire video container and hide canvas
        _videosContainer.style.visibility = "visible";
        _videoCanvas.style.visibility = "hidden";
        _isFixed = _imgWasSet = true;
        //console.log("Fixed");
    }

    function unfixVideos() {
        //Hide entire video container and show canvas
        _videosContainer.style.visibility = "hidden";
        _videoCanvas.style.visibility = "visible";
        _isFixed = false;
        //console.log("Unfixed");
    }

    function playVideo(_id, _play) {
        if (_play) {
            _videoHasPlayed = _videoIsPlaying = true;
            _video.play();
        }
        else {
            _videoIsPlaying = false;
            _video.pause();
        }
    }

    function videoEnded(e) {
        //console.log("Video ended");
        //Restart video when user scrolls back up
        _yOnScrollerInit = _windowY;
        _restartVideoWhenScrollUp = true;
    }

    function updateMask(_y) {
        //Redraw canvas with circular mask
        _videoCxt.save();
        //Some browsers don't show first frame in video, so we show black instead
        if (!_videoHasPlayed) {
            _videoCxt.fillStyle = "#000000";
            _videoCxt.fillRect(0, 0, _videoW, _videoH);
        }
        _videoCxt.drawImage(_video, 0, 0, _videoW, _videoH);
        _videoCxt.globalCompositeOperation = 'destination-in';
        _videoCxt.beginPath();
        _videoCxt.arc(_pageW * .5 - _videoOffsetX/*+_sideMargin*/, _y - _videoOffsetY, _circleRadius, 0, Math.PI * 2, false);
        _videoCxt.fill();
        _videoCxt.restore();
    }

    //Resizing
    var _sw = 0, _realSh = 0, _sh = 0;//entire window
    var _pageW, _pageH;//This module
    var _sideMargin = 30, _topMargin = 54, _bottomMargin = 30;
    var _bodyRect;

    function doResize() {
        _bodyRect = document.body.getBoundingClientRect(); //Used for getting actual width without scrollbars
        if (window.innerWidth) _sw = window.innerWidth, _sh = window.innerHeight;
        else _sw = document.documentElement.offsetWidth, _sh = document.documentElement.offsetHeight;
        //if(H8._isTouch) _sh = window.screen.availHeight;
        //Is the difference acceptable/realistic? So we use the bounding rect for measuring screen width
        if (Math.abs(_bodyRect.width - _sw) < 100) _sw = _bodyRect.width;
        _realSh = _sh;
        //Compensate for margins
        _pageW = _sw - _sideMargin * 2;
        _sh -= (_topMargin + _bottomMargin);
        //_pageH = _realSh * _shFactor;
        _pageH = _realSh * _shFactor;
        //console.log(_sw, _pageW, _sh, _pageH);
        //console.log(_bodyRect);
        //Set the container in the correct size
        _container.style.height = _pageH - (_topMargin + _bottomMargin) + "px";
        //Vars for scrolling
        _pageOffset = jQuery(_container).offset().top - _topMargin;
        _imgWasSet = false;
        //Video canvas
        if (_pageW / _sh < 16 / 9) _videoH = _sh, _videoW = Math.round(_videoH * (16 / 9));
        else _videoW = _pageW, _videoH = Math.round(_videoW / (16 / 9));
        _targetRadius = Math.sqrt(Math.pow(_pageW, 2) + Math.pow(_sh, 2));
        _videoCanvas.width = _videoW, _videoCanvas.height = _videoH;
        _videosContainer.style.width = _videoW + "px";
        _videosContainer.style.height = _videoH + "px";
        _videosContainer.style.marginTop = _topMargin + "px";
        //Center video and canvas
        _videoOffsetX = Math.round((_sw - _videoW) / 2) - _sideMargin, _videoOffsetY = Math.round((_sh - _videoH) / 2);
        TweenLite.to(_video, 0, {x: _videoOffsetX, y: _videoOffsetY});
        TweenLite.to(_videoCanvas, 0, {x: _videoOffsetX, y: _videoOffsetY});
        //Resize menu
        _sideMenu.resize(_sw, _sh, _sideMargin, _topMargin);
        //Update overlays
        for (var i = 0; i < _numOverlays; i++) _videoOverlays[i].resize(_realSh);//_realSh
        //Update scroller helper
        H8._docuScroller.resize(_sh, _realSh, _pageH - (_topMargin + _bottomMargin), _pageOffset);
        //Move the gestures (empty) container up to the video gestures
        _gesturesContainer.style.marginTop = -_realSh * 2 + "px";
        _gesturesContainer.style.height = _realSh * 2 + "px";
    }

    _this.resize = function () {
        doResize();
    }
    //Listen for resizing
    H8Events(window, "resize", doResize, true);
    doResize();
    //Check for being in view
    manageEngine();
    //Set background
    function setCanvasBg() {
        _videoCanvas.style.backgroundColor = "#302625";
    }

    TweenLite.to(_container, .6, {
        backgroundColor: "#302625",
        delay: .4,
        ease: Quad.easeInOut,
        onComplete: setCanvasBg
    });
    //_container.style.backgroundColor = "#302625";
}
function H8SideMenu() {
    var _container = document.getElementById('H8SideMenu');
    var _items = [], _btns = [], _targets = [4, 11, 18];
    var _this = this;
    var _numItems = 24, _numBtns = 3, _top = 50, _bottom = 50, _left = 25, _x = 0, _dist = 0, _direction = 0, _w = 50, _minW = 8, _p = 0, _spacing = 0;
    var _bottomArrow = document.getElementById('svgArrow');
    var _arrow = _bottomArrow.firstChild;
    var _muteBtn = document.getElementById('H8Mute');
    var _muteA = document.getElementById('H8MuteA');
    var _muteB = document.getElementById('H8MuteB');
    var _isMuted = false;

    function over(e) {
        TweenLite.to(e.currentTarget, .2, {opacity: 1, ease: Quad.easeOut});
    }

    function out(e) {
        TweenLite.to(e.currentTarget, .2, {opacity: .7, ease: Quad.easeOut});
    }

    function clicked(e) {
        H8._docuScroller.jumpToEnd(); //Scroll to end of video module
    }

    function clickedMute(e) {
        _isMuted = !_isMuted;
        if (_isMuted) {
            H8._bgVideo.muted = true;
            _muteB.style.visibility = "visible";
            _muteA.style.visibility = "hidden";
        }
        else {
            H8._bgVideo.muted = false;
            _muteA.style.visibility = "visible";
            _muteB.style.visibility = "hidden";
        }
    }

    function createItems() {
        for (var i = 0; i < _numItems; i++) {
            var _item = new H8SideMenuItem(i);
            _items.push(_item);
            _container.appendChild(_item._html);
        }
        for (i = 0; i < _numBtns; i++) _btns.push(new H8SideMenuButton(i, _container.children[i + 1]));
    }

    _this.resize = function (_sw, _sh, _sideMargin, _topMargin) {
        _spacing = Math.round((_sh - (_top + _bottom + _topMargin)) / _numItems);
        _x = (_sw - _sideMargin * 2 - _left);
        for (var i = 0; i < _numItems; i++) TweenLite.to(_items[i]._html, 0, {
            x: _x + _sideMargin,
            y: (_topMargin + i * _spacing + _top)
        });
        for (i = 0; i < _numBtns; i++) _btns[i].position(_x - 120, _topMargin + _top + _targets[i] * _spacing);
        _muteBtn.style.left = _sw - _sideMargin * 3 - 10 + "px";
        _muteBtn.style.top = _sh + _topMargin - 100 + "px";
    }
    _this.progress = function (p) {
        _p = p;
        for (var i = 0; i < _numItems; i++) {
            _dist = _w - Math.round(Math.pow(Math.abs(i / (_numItems - 1) - _p), .3) * _w);
            if (_dist < _minW + 4) _dist = _minW;
            _items[i].setWidth(_dist);
        }
        for (i = 0; i < _numBtns; i++) {
            _dist = _w - Math.round(Math.pow(Math.abs(_targets[i] / (_numItems - 1) - _p), .3) * _w);
            if (_dist < _minW + 4) _dist = _minW;
            else if (_dist > 30) _dist = 30;
            _btns[i].move(_dist);
        }
    }

    //Anim in/out
    _this.show = function () {
        if (_p < .5) for (var i = 0; i < _numItems; i++) _items[i].show(i * .01 + .8);
        else for (i = 0; i < _numItems; i++) _items[i].show(_numItems * .01 - i * .01 + .8);
        for (i = 0; i < _numBtns; i++) _btns[i].show();
        //Show arrow
        TweenLite.to(_arrow, 1.2, {drawSVG: "100%", delay: 1, ease: Strong.easeInOut});
        TweenLite.to(_muteBtn, .6, {autoAlpha: .7, delay: 1.1, ease: Quad.easeInOut});
    }
    _this.hide = function () {
        if (_p < .5) for (var i = 0; i < _numItems; i++) _items[i].hide(i * .01);
        else for (i = 0; i < _numItems; i++) _items[i].hide(_numItems * .01 - i * .01);
        for (i = 0; i < _numBtns; i++) _btns[i].hide();
        TweenLite.killTweensOf(_arrow);
        TweenLite.to(_arrow, .6, {drawSVG: "100% 100%", ease: Quad.easeInOut});
        TweenLite.killTweensOf(_muteBtn);
        TweenLite.to(_muteBtn, .4, {autoAlpha: 0, ease: Quad.easeOut});
    }
    _this.simpleVersion = function () {
        _container.style.visibility = "hidden";
    }
    _this.init = function () {
        createItems();
        jQuery(_bottomArrow).on("mouseover", over), jQuery(_bottomArrow).on("mouseout", out), jQuery(_bottomArrow).on("click", clicked);
        jQuery(_muteBtn).on("mouseover", over), jQuery(_muteBtn).on("mouseout", out), jQuery(_muteBtn).on("click", clickedMute);
        TweenLite.to(_arrow, 0, {drawSVG: "100% 100%"});
        _bottomArrow.style.visibility = "visible";
        _this.progress(_p);
    }
}
function H8SideMenuItem(_id) {
    var _this = this;
    var _ID = _id;
    _this._html = document.createElement("div");
    _this._html.className = "H8SideMenuItem";
    _this._animPercent = 0;
    var _oldW = 0;

    _this.setWidth = function (_dist) {
        _oldW += (_dist * _this._animPercent - _oldW) * .4;
        TweenLite.to(_this._html, 0, {width: _oldW, left: -_oldW});
    }
    _this.show = function (_delay) {
        _this.killTweens();
        _this._animPercent = 0;
        TweenLite.to(_this, .6, {_animPercent: 1, delay: _delay, ease: Quad.easeInOut});
        TweenLite.to(_this._html, .6, {autoAlpha: .7, delay: _delay, ease: Quad.easeInOut, force3D: true});
    }
    _this.hide = function (_delay) {
        _this.killTweens();
        TweenLite.to(_this, .4, {_animPercent: 0, delay: _delay, ease: Quad.easeOut});
        TweenLite.to(_this._html, .4, {
            autoAlpha: 0,
            delay: _delay,
            ease: Quad.easeOut,
            onUpdate: _this.setWidth,
            onUpdateParams: [0]
        });
    }
    _this.killTweens = function () {
        TweenLite.killTweensOf(_this._html);
        TweenLite.killTweensOf(_this);
    }
}
function H8SideMenuButton(_id, _element) {
    var _this = this;
    var _ID = _id;
    var _high = Math.round(jQuery(_element).height() * .5);
    var _baseAlpha = .5, _oldW = 0, _myX = 0, _currentAlpha = .5, _targetW = 22;
    if (_ID == 1) _targetW = 24;
    //Manage highlighting when content is at this button's position
    var _isHighlighted = false, _isHidden = true;
    _this._animPercent = .5;

    _this.position = function (_x, _y) {
        _myX = _x;
        TweenLite.to(_element, 0, {x: _myX - _oldW, y: _y - _high, force3D: true});
    }
    _this.move = function (_dist) {
        _oldW += (_dist * _this._animPercent - _oldW) * .2;
        TweenLite.to(_element, 0, {x: _myX - _oldW});
        if (_isHidden) return;
        if (!_isHighlighted && _oldW > _targetW) highlight();
        else if (_isHighlighted && _oldW < _targetW) unhighlight();
    }
    _this.show = function () {
        //_this.killTweens();
        _isHidden = false;
        _this._animPercent = .5;
        TweenLite.to(_this, .6, {_animPercent: 1, delay: 1.2, ease: Quad.easeInOut});
        TweenLite.to(_element, .6, {autoAlpha: _currentAlpha, delay: 1.2, ease: Quad.easeInOut});
    }
    _this.hide = function (_delay) {
        _this.killTweens();
        _isHidden = true;
        TweenLite.to(_this, .4, {_animPercent: .5, ease: Quad.easeOut});
        TweenLite.to(_element, .4, {autoAlpha: 0, ease: Quad.easeOut});
    }
    _this.killTweens = function () {
        TweenLite.killTweensOf(_element);
        TweenLite.killTweensOf(_this);
    }
    function highlight() {
        _isHighlighted = true;
        _currentAlpha = 1;
        TweenLite.to(_element, .6, {opacity: _currentAlpha, ease: Quad.easeInOut});
    }

    function unhighlight() {
        _isHighlighted = false;
        _currentAlpha = _baseAlpha;
        TweenLite.killTweensOf(_element);
        TweenLite.to(_element, .6, {autoAlpha: _currentAlpha, delay: 1.2, ease: Quad.easeInOut});
    }

    function over(e) {
        TweenLite.to(_element, .2, {opacity: 1, ease: Quad.easeOut});
    }

    function out(e) {
        TweenLite.to(_element, .2, {opacity: _currentAlpha, ease: Quad.easeOut});
    }

    function clicked(e) {
        _H8VideoModule.scrollToText(_ID);
    }

    //Setup listeners
    jQuery(_element).on("mouseover", over), jQuery(_element).on("mouseout", out), jQuery(_element).on("click", clicked);
}

function H8VideoOverlay(_id, _element, _breakpoint) {
    var _this = this;
    var _el = _element;
    var _bp = _breakpoint;
    var _isVisible = false, _isAnimIn = false, _hasVideos = (_id == 3), _postersLoaded = false;
    _this._scrollOffset = 0;
    var _centerDead = .1; //Percent in center where scroll is toggled off
    var _targetY = 0, _newValue = 0, _offsetY = 0, _half_sh = 0;

    /*t = current time, b = start value, c = change in value, d = duration*/
    //http://gizma.com/easing/
    _this.getQuad = function (t, b, c, d) {
        t /= d;
        return c * t * t + b;
    }
    _this.getQuart = function (t, b, c, d) {
        t /= d;
        return c * t * t * t * t + b;
    }
    _this.easing = function (_p, half_sh) {
        /*if(_id == 3 || _id == 2) _newValue = _this.getQuad(_p, 0, half_sh-_p, 1) / half_sh;
         else if(_id != 2)*/
        _newValue = _this.getQuart(_p, 0, half_sh - _p, 1) / half_sh;
        if (_p < 0) return -_newValue;
        return _newValue;
    }

    _this.move = function (_p, _sh, _topMargin) {
        _half_sh = _sh * .5;
        var _distanceToY = _targetY - (_sh * _p); //0 = center of screen
        //if(_id == 3) console.log(_distanceToY/_sh)
        //console.log("Before",_distanceToY);
        //Load video posters
        if (!_postersLoaded && _id == 3 && Math.abs(_distanceToY / _sh) < 2) {
            _postersLoaded = true;
            for (var i = 0; i < _numVideos; i++) _touchVideos[i].firstTime();
        }
        var _deadZone = _centerDead * _half_sh;
        var _percentToCenter = 0;
        if (_distanceToY < 0) {
            //Find adjusted value, taking into consideration the dead area
            if (_distanceToY > -_deadZone) _distanceToY = 0; //If inside area
            else {
                _distanceToY = _deadZone + _distanceToY;
                _percentToCenter = _distanceToY / ((_half_sh - _deadZone));
            }
        }
        else {
            //Find adjusted value, taking into consideration the dead area
            if (_distanceToY < _deadZone) _distanceToY = 0; //If inside area
            else {
                _distanceToY = _deadZone - _distanceToY;
                _percentToCenter = _distanceToY / ((_deadZone - _half_sh));
            }
        }

        //Apply easing in order to make center area smoother scrolling
        if (_id != 2 || (_id == 2 && _percentToCenter < 0)) _percentToCenter = _this.easing(_percentToCenter, _half_sh) * .03;
        //Manage visibility (and movement)
        if (_isVisible) {
            if (_percentToCenter < -2 || _percentToCenter > 2) {
                _isVisible = false;
                _el.style.visibility = "hidden";
                //Check if anim out was called (because really fast scrolling skips it)
                if (_isAnimIn) _this.animOut();
            }
        }
        else {
            if (_percentToCenter > -2 && _percentToCenter < 2) {
                _isVisible = true;
                _el.style.visibility = "visible";
            }
        }
        //console.log("After",_distanceToY, _percentToCenter);
        _offsetY += ((_half_sh + _half_sh * _percentToCenter) - _offsetY) * .2;
        if (!_isVisible) return;
        TweenLite.to(_el, 0, {y: _offsetY, force3D: true});
        //Show/hide content
        if (!H8._allowEngine) return;
        if (!_isAnimIn && Math.abs(_percentToCenter) < .3) {
            _isAnimIn = true;
            if (_id < 3) H8._scrollIcon.animIn();
            _this.animInCircle();
            if (_hasVideos) _this.initVideos();
        }
        else if (_isAnimIn && Math.abs(_percentToCenter) >= .35) {
            _this.animOut();
        }
    }
    _this.animOut = function () {
        _isAnimIn = false;
        H8._scrollIcon.animOut();
        _this.animOutCircle();
        if (_hasVideos) _this.stopVideos();
    }

    //Animate the svg circle
    var _circle, _icon, _subHeader
    if (!_hasVideos) _circle = _element.firstChild.firstChild.firstChild, _icon = _element.firstChild.childNodes[1], _subHeader = _element.firstChild.childNodes[2];
    else _subHeader = _element.firstChild;

    _this.animInCircle = function () {
        _this.killTweens();
        TweenLite.to(_subHeader, .8, {autoAlpha: 1, delay: .3, ease: Quad.easeInOut, force3D: true});
        if (_hasVideos) return;
        TweenLite.to(_circle, 1.2, {drawSVG: "100%", ease: Strong.easeInOut});
        TweenLite.to(_icon, 0, {scale: 1.4});
        TweenLite.to(_icon, .8, {autoAlpha: 1, scale: 1, delay: .4, ease: Quad.easeInOut, force3D: true});
    }
    _this.animOutCircle = function () {
        _this.killTweens();
        TweenLite.to(_subHeader, .8, {autoAlpha: 0, ease: Quad.easeInOut});
        if (_hasVideos) return;
        TweenLite.to(_circle, 1.2, {drawSVG: "0%", ease: Strong.easeInOut});
        TweenLite.to(_icon, .8, {autoAlpha: 0, scale: .5, ease: Quad.easeInOut});
    }
    _this.killTweens = function () {
        TweenLite.killTweensOf(_subHeader);
        if (_hasVideos) return;
        TweenLite.killTweensOf(_circle);
        TweenLite.killTweensOf(_icon);
    }
    _this.resize = function (_sh) {
        _targetY = _sh * _bp;
        _this._scrollOffset = _targetY;
        //console.log("Target: " + _this._scrollOffset);
    }

    //Touch videos overlay
    var _videosJQ, _tvHolder, _randomTimer, _touchVideos, _numVideos, _allVideosShuffled, _randomIndex = 0, _allowUserVideos = false;
    _this.manageTouchVideos = function () {
        _tvHolder = document.getElementById('H8TouchVideos');
        _videosJQ = jQuery(_tvHolder).find("div.H8TouchVideo");
        _touchVideos = [], _allVideosShuffled = [];
        _numVideos = _videosJQ.length;
        for (var i = 0; i < _numVideos; i++) _touchVideos.push(new H8TouchVideo(i, _videosJQ[i])), _allVideosShuffled.push(i);
        //_randomIndex = _numVideos;
        //_randomIndex = 0;
        //Shuffle the order to play random videos (use array instead of Math.random so we go through all videos without duplicate plays)
        //_allVideosShuffled = randomize(_allVideosShuffled);
    }

    function randomize(_posnputArray) {
        var _copy = _posnputArray.concat();
        var _shuffled = new Array();
        var _random = 0, _l = _copy.length;
        for (var i = 0; i < _l; i++) {
            _random = getRandomInt(0, _copy.length - 1);
            _shuffled.push(_copy[_random]);
            _copy.splice(_random, 1);
        }
        return _shuffled;
    }

    function getRandomInt(_min, _max) {
        return _min + Math.floor(Math.random() * (_max + 1 - _min));
    }

    _this.playTouchVideo = function () {
        //_randomIndex--;
        _randomIndex++;
        /*if(_randomIndex < 0) _this.killRandomVideos();
         else _touchVideos[_allVideosShuffled[_randomIndex]].play();*/
        if (_randomIndex >= _numVideos) _this.killRandomVideos();
        else _touchVideos[_allVideosShuffled[_randomIndex]].play();
    }
    _this.initVideos = function () {
        //Anim in videos
        for (var i = 0; i < _numVideos; i++) _touchVideos[i].animIn(i * .03 + .5);
        //Start automatic random playing
        //if(!_allowUserVideos) _randomTimer = setInterval(_this.playTouchVideo, 2000);//2000
    }
    _this.killRandomVideos = function () {
        clearInterval(_randomTimer);
        _allowUserVideos = true;
        for (var i = 0; i < _numVideos; i++) _touchVideos[i].initInteraction();
    }
    _this.stopVideos = function () {
        clearInterval(_randomTimer);
        for (var i = 0; i < _numVideos; i++) _touchVideos[i].animOut(((_numVideos - 1) - i) * .03);
    }

    _this.simpleVersion = function () {
        _el.style.position = "relative";
        _el.style.width = "600px";
        _el.style.left = "50%";
        _el.style.marginLeft = "-300px";
        _el.style.height = "245px";
        _el.style.visibility = "visible";
        _el.className = "H8VideoOverlay simpleLayout";
        _el.style.marginTop = "0px";
        _el.style.top = "120px";
        //Show icon and subheader
        if (!_hasVideos) TweenLite.to(_icon, 0, {autoAlpha: 1, scale: 1});
        if (_id == 3) _el.style.display = "none";
    }
    _this.init = function () {
        if (_hasVideos) _this.manageTouchVideos();
        else TweenLite.to(_circle, 0, {drawSVG: "0% 0%"});
    }
}

function H8TouchVideo(_id, _element) {
    var _this = this;
    var _video = _element.firstChild;
    var _text = _element.children[1];
    var _playBtn;
    var _isFirstTime = true, _isPlaying = false, _isInit = false;
    var _animTime = .5;

    _this.firstTime = function () {
        if (!_isFirstTime) return;
        _isFirstTime = false;
        //Show poster
        _video.poster = H8getImg("Assets/Images/tv" + (_id + 1) + ".jpg");
        //Change preload value in video
        _video.preload = "metadata";
        //For safari the border radius wont work, instead use a mask:
        if (H8._isSafari) _video.style["-webkit-mask-image"] = 'url("/~/media/1854bad8ef664b1e9f8c11fd6d939a5d")';
        //Listen for finishing clip
        H8Events(_video, 'ended', _this.videoEnded, true);
        //Init
        _this.initInteraction();
    }
    _this.videoEnded = function (e) {
        _this.stop();
    }
    _this.animIn = function (_delay) {
        _this.firstTime();
        TweenLite.to(_text, .6, {autoAlpha: 1, delay: _delay, ease: Quad.easeInOut});
        //_this.play();
        _this.showPlayBtn(Math.random() * .2);
    }
    _this.animOut = function (_delay) {
        TweenLite.killTweensOf(_text);
        TweenLite.to(_text, .6, {autoAlpha: 0, delay: _delay, ease: Quad.easeInOut, onComplete: _this.checkKill});
        _this.hidePlayBtn();
    }
    _this.checkKill = function () {
        if (_isPlaying) _this.stop();
    }
    _this.play = function () {
        if (_isPlaying) return;
        _isPlaying = true;
        _video.currentTime = 0;
        _video.play();
        _this.hidePlayBtn();
        TweenLite.to(_video, _animTime, {borderColor: "#22333a", scale: 1.05, ease: Quad.easeOut});
    }
    _this.stop = function () {
        _isPlaying = false;
        //Poster can't be shown again, so we force video to scroll
        _video.currentTime = 1.5;
        _video.pause();
        _this.showPlayBtn(0);
        TweenLite.to(_video, _animTime + .2, {borderColor: "#182429", scale: 1, ease: Quad.easeOut});
    }
    _this.initInteraction = function () {
        if (_isInit) return;
        _isInit = true;
        //Create play icon
        _playBtn = document.createElement("div");
        _playBtn.className = "playBtn";
        _element.appendChild(_playBtn);
        _this.showPlayBtn(Math.random() * .2);
        _animTime = .2;
        jQuery(_playBtn).on("mouseover", over);
    }
    _this.showPlayBtn = function (_delay) {
        if (!_playBtn) return;
        TweenLite.killTweensOf(_playBtn);
        TweenLite.to(_playBtn, .4, {autoAlpha: 1, delay: _delay, ease: Quad.easeInOut});
    }
    _this.hidePlayBtn = function () {
        if (!_playBtn) return;
        TweenLite.killTweensOf(_playBtn);
        TweenLite.to(_playBtn, .4, {autoAlpha: 0, ease: Quad.easeInOut});
    }
    //Setup listener for activating video
    function over(e) {
        _this.play();
    }
}

function scrollIcon() {
    var _this = this;
    var _el = document.getElementById('H8ScrollIcon');
    var _line = document.getElementById('H8ScrollLine');
    var _delay = 0;
    var _firstTime = true;
    var _isAnimedIn = false;

    _this.animIn = function () {
        if (_isAnimedIn) return;
        _isAnimedIn = true;
        //console.log("Scroll animIn");
        if (_firstTime || _el.style.visibility == "hidden") _delay = 2;
        else _delay = 2;
        _firstTime = false;
        _this.killTweens();
        TweenLite.to(_line, 0, {scaleY: 0, y: 60});
        TweenLite.to(_line, .8, {scaleY: 1, y: 0, delay: _delay + .2, ease: Quad.easeInOut});
        TweenLite.to(_el, .8, {autoAlpha: 1, delay: _delay, ease: Quad.easeInOut, onComplete: _this.loop});
    }
    _this.animOut = function () {
        if (!_isAnimedIn) return;
        _isAnimedIn = false;
        //console.log("Scroll animOut");
        _this.killTweens();
        TweenLite.to(_line, .8, {scaleY: 0, y: -60, ease: Quad.easeInOut});
        TweenLite.to(_el, .8, {autoAlpha: 0, ease: Quad.easeInOut});
    }
    _this.loop = function () {
        TweenLite.to(_line, .6, {scaleY: 0, y: -60, delay: 3.5, ease: Quad.easeIn, onComplete: _this.loopB});
    }
    _this.loopB = function () {
        TweenLite.to(_line, 0, {scaleY: 0, y: 60});
        TweenLite.to(_line, 1, {scaleY: 1, y: 0, ease: Quad.easeOut, onComplete: _this.loop});
    }
    _this.killTweens = function () {
        TweenLite.killTweensOf(_line);
        TweenLite.killTweensOf(_el);
    }
}

function docuScroll() {
    var _this = this;
    var _endOfModule = 0, _sh = 0, _realSh = 0, _allowTimer = 0, _timer = 0, _curPos = 0;

    _this.jumpToEnd = function () {
        //console.log("Jump to end of video module!");
        H8._allowEngine = false;
        clearTimeout(_allowTimer);
        _allowTimer = setTimeout(_this.allowEngine, 1200);
        TweenLite.to(window, 1.2, {scrollTo: {y: _endOfModule}, ease: Quad.easeOut});
        H8._scrollIcon.animOut();
    }

    _this.scrollToText = function (_y, _ignoreUser, _time, _lastOverlay) {
        //Only scroll to text if user didn't scroll further (we don't want to take over if user is scrolling)
        _curPos = jQuery(window).scrollTop();
        //console.log("Scroll to: ", _y, "current pos: ", _curPos);
        if (_curPos < _y - 100 || _ignoreUser == true) {
            TweenLite.to(window, _time, {scrollTo: {y: _y}, ease: Quad.easeOut});
            //If this was set by video trigger, then we remove it after a short while
            clearTimeout(_timer);
            if (!_ignoreUser && !_lastOverlay) {
                _timer = setTimeout(_this.scrollToOver, _time * 1000 + 100);
            }
        }
    }

    _this.scrollToOver = function () {
        //Start listening for user scrolling
        _curPos = jQuery(window).scrollTop();
        H8Events(window, "scroll", _this.cancelAutoRemoval, true);
        clearTimeout(_timer);
        _timer = setTimeout(_this.autoScrollTextOffscreen, 4000);

    }
    _this.cancelAutoRemoval = function () {
        //console.log("CANCEL AUTO REMOVAL");
        H8Events(window, "scroll", _this.cancelAutoRemoval, false);
        clearTimeout(_timer);
    }
    _this.autoScrollTextOffscreen = function () {
        //console.log("Remove text again");
        _this.scrollToText(_curPos + _realSh * 2, true, 2);
        H8Events(window, "scroll", _this.cancelAutoRemoval, false);
    }

    _this.allowEngine = function () {
        H8._allowEngine = true;
    }

    _this.resize = function (sh, realSh, _pageH, _pageOffset) {
        _sh = sh, _realSh = realSh, _endOfModule = _pageH + _pageOffset;
    }
}

function H8FocusModule(_showStats) {
    var _this = this;
    var _container = document.getElementById('H8FocusContainer');
    //Texts
    var _textContainer = document.getElementById('H8FocusTexts');
    var _allTexts = jQuery(_textContainer).find(".H8FT");
    var _numTexts = _allTexts.length;
    var _shFactor = _numTexts; //Num images/texts + 1
    var _texts = [];
    //Images
    var _imageContainer = document.getElementById('H8FocusImages');
    var _centeredImgHolder = document.getElementById('H8ImgCentered');
    var _images = [];
    for (var i = 0; i < _numTexts; i++) _texts.push(new movingText(i, _allTexts[i])), _images.push(new maskImage(i, _centeredImgHolder/*, _centeredImgHolder.children[i]*/));
    //Defines intervals for scrolling
    var _windowY, _pageOffset, _localY, _areaScrolled, _snapTimer;
    var _isRunning = false, _inView = false, _isImgFixed = false;
    H8._docuScrollerB = new docuScrollB();

    if (!H8._isTouch && H8._isIEVersion > 8) {
        H8Events(window, "scroll", manageEngine, true);
        //jQuery(document).scroll(manageEngine);
        for (i = 0; i < _numTexts; i++) _texts[i].init();
        _imageContainer.style.left = "-15px";
    }
    else {
        //Simple version
        _container.style.backgroundColor = "#c9aba1";
        _imageContainer.style.display = "none";
        _textContainer.setAttribute("id", "empty");
        _textContainer.className = "H8FocusTextsSL";
        for (i = 0; i < _numTexts; i++) _texts[i].simpleVersion();
        document.getElementById('simpleHeader').style.display = "block";
        var _newBg = document.createElement("div");
        _newBg.className = "simplgBg";
        _container.insertBefore(_newBg, _container.firstChild);
        _this.resize = function () {
        };
        return;
    }

    //Manage mouse down to toggle off snapping
    var _allowTimer = 0, _allowSnap = true;

    function down(e) {
        //console.log("DOWN");
        _allowSnap = false;
        clearTimeout(_allowTimer);
        _allowTimer = setTimeout(allowSnapAgain, 2000);
    }

    function allowSnapAgain() {
        _allowSnap = true;
    }

    function up(e) {
        //console.log("UP");
        clearTimeout(_allowTimer);
        allowSnapAgain();
        manageEngine(null);
    }

    //Manage starting and stopping engine
    function manageEngine(e) {
        _windowY = jQuery(window).scrollTop();
        _localY = _windowY - _pageOffset;
        /*console.log("Window y: " + _windowY);
         console.log("Offset for module: " + _pageOffset);
         console.log("Local y: " + _localY);*/
        if (_windowY >= _pageOffset - _sh && _localY < _pageH) _inView = true;
        else _inView = false;
        if (_isRunning) {
            //Check for out of screen and kill engine
            if (!_inView) stopEngine();
        }
        else {
            //Check for inside screen and start engine
            if (_inView) {
                //console.log("Start engine");
                _isRunning = true;
                TweenLite.ticker.addEventListener('tick', engine);
                //Listen for mouse down (don't snap when mouse is down, user might be scrolling)
                jQuery(document).on("mousedown", down);
                jQuery(document).on("mouseup", up);
                //First time: load images
                for (var i = 0; i < _numTexts; i++) _images[i].load();
            }
        }
        //Manage snapping
        clearTimeout(_snapTimer);
        if (_isRunning && _allowSnap) _snapTimer = setTimeout(snap, 500);
    }

    function stopEngine() {
        //console.log("Kill engine focus");
        engine(null);
        _isRunning = false;
        TweenLite.ticker.removeEventListener('tick', engine);
        jQuery(document).off("mousedown", down);
        jQuery(document).off("mouseup", up);
        _allowSnap = true;
    }

    function snap() {
        var _snapTo = Math.round(_areaScrolled - 1);
        if (_snapTo < 0 || _snapTo > _numTexts - 1) return;
        H8._docuScrollerB.scrollToText(_images[_snapTo]._scrollOffset + _pageOffset);
        _snapTimer = setTimeout(stopEngine, 1000);
    }

    //Manage positioning while module is in view
    function engine(e) {
        //Calculate percentage of screen height we have scrolled in this module. Values are from 0-(_shFactor+1)
        _areaScrolled = (_localY + _sh) / _pageH * _shFactor;
        if (_areaScrolled < 0) _areaScrolled = 0;
        //console.log("Local y: " + _localY);
        //console.log("Percent scrolled in module: " + _areaScrolled);
        //0-1 are when anim in, _shFactor - (_shFactor+1) are when anim out.

        //ANIM IN
        if (_areaScrolled < 1) {
            if (_isImgFixed) unfixImages(0);
        }
        //ANIM OUT
        else if (_areaScrolled > _shFactor) {
            if (_isImgFixed) unfixImages(_pageH - _sh);
        }
        else {
            if (_areaScrolled >= 1) {
                if (!_isImgFixed) fixImages();
            }
        }
        //Manage masking of images
        for (var i = 0; i < _numTexts; i++) _images[i].mask(_areaScrolled), _texts[i].updateY(_areaScrolled);
    }

    function fixImages() {
        _isImgFixed = true;
        _imageContainer.style.position = "fixed";
        _imageContainer.style.marginTop = _topMargin + "px";
        _imageContainer.style.left = "-0px";
    }

    function unfixImages(_m) {
        _isImgFixed = false;
        _imageContainer.style.position = "absolute";
        _imageContainer.style.marginTop = _m + "px";
        _imageContainer.style.left = "-15px";
    }


    //Resizing
    var _sw = 0, _sh = 0;//entire window
    var _pageW, _pageH;//This module
    var _sideMargin = 30, _topMargin = 54, _bottomMargin = 30, _imgTopMargin = 0;
    var _bodyRect;

    function doResize() {
        _bodyRect = document.body.getBoundingClientRect(); //Used for getting actual width without scrollbars
        if (window.innerWidth) _sw = window.innerWidth, _sh = window.innerHeight;
        else _sw = document.documentElement.offsetWidth, _sh = document.documentElement.offsetHeight;
        //Compensate for margins
        _pageW = _sw - _sideMargin * 2;
        _sh -= (_topMargin + _bottomMargin);
        _pageH = _sh * _shFactor;
        //Vars for scrolling
        _pageOffset = jQuery(_container).offset().top - _topMargin;
        //console.log(_sw, _pageW, _sh, _pageH);
        //console.log(_bodyRect);
        //Set the container in the correct size
        _container.style.height = _pageH + "px";
        _imageContainer.style.height = _sh + "px";
        //Check images scale and position, so they always fit screen
        var _imgW = _pageW * .5 + 15, _imgH = _sh;
        var _rel = _imgW / _imgH, _imgRel = (960 / 1200);
        if (_rel < _imgRel) {
            _imgTopMargin = -_imgH / 2;
            _centeredImgHolder.style.width = _imgH * _imgRel + "px";
            _centeredImgHolder.style.marginLeft = (-_imgH * _imgRel * .5)/* + _sideMargin*/ + "px";
        }
        else {
            _imgTopMargin = -(_imgW / _imgRel) / 2;
            _centeredImgHolder.style.width = _imgW + "px";
            _centeredImgHolder.style.marginLeft = -_imgW / 2/* + _sideMargin*/ + "px";
        }
        _centeredImgHolder.style.marginTop = _imgTopMargin + "px";
        for (var i = 0; i < _numTexts; i++) {
            _allTexts[i].style.visibility = "visible";
            _allTexts[i].style.top = _sh * i + _sh * .5 + "px", _images[i].resize(Math.ceil(_pageW * .5), _sh, _imgTopMargin);
        }
        //Update scroller helper
        H8._docuScrollerB.resize(_sh);
        //Render
        if (_inView) engine(null);
    }

    function resizeLoop() {
        var _new = jQuery(_container).offset().top - _topMargin;
        if (_pageOffset == _new) return;
        else doResize();
    }

    setInterval(resizeLoop, 5000);
    _this.resize = function () {
        doResize();
    }
    //Listen for resizing
    H8Events(window, "resize", doResize, true);
    doResize();
    //Check for being in view
    if (!H8._isTouch) manageEngine();
}

function maskImage(_id, _holder) {
    var _this = this;
    var _sw = 0, _sh = 0, _imgTopMargin = 0, _h = 0, _localPercent = 1, _newPercent = 0, _limitTop = 0, _outOfBounds = true, _loaded = false;
    _this._scrollOffset = 0;
    //Create image
    _this._img = new Image();
    if (!H8._isIE) _this._img.className = "H8FImg threed";
    else _this._img.className = "H8FImg";
    if (_id == 0) _this._img.style.opacity = 0;
    _holder.appendChild(_this._img);
    //Avoid dragging image
    _this._img.onmousedown = function (e) {
        if (e && e.preventDefault) e.preventDefault();
    }
    _this.load = function () {
        if (_loaded) return;
        _loaded = true;
        _this._img.onload = _this.imageLoaded;
        _this._img.src = H8getImg("Assets/Images/f" + (_id + 1) + ".jpg");
    }
    _this.imageLoaded = function () {
        //console.log("Loaded: " + _id);
        if (_id == 0) TweenLite.to(_this._img, 1, {opacity: 1, delay: .2, ease: Quad.easeInOut});
    }
    _this.resize = function (sw, sh, imgTopMargin) {
        _sw = sw, _sh = sh, _imgTopMargin = imgTopMargin;
        _limitTop = -_sh * .5;
        _this._scrollOffset = _sh * _id;
        if (_id == 0) _this._img.style.clip = "rect(" + (-_sh - _imgTopMargin) + "px," + _sw + "px," + (_sh - _imgTopMargin) + "px,0px)", _this._img.style.visibility = "visible";
    }
    _this.mask = function (_areaScrolled) {
        if (_id > 0) {
            _newPercent = 1 - Math.max(0, _areaScrolled - _id + .5);
            _localPercent += (_newPercent - _localPercent) * .2;
            //console.log(_areaScrolled, _sh, _localPercent);
            if (_localPercent > .5 || _localPercent < -1.5) {
                //console.log("Out of bounds");
                if (!_outOfBounds) {
                    _outOfBounds = true;
                    _this._img.style.clip = "rect(" + (_sh - _imgTopMargin) + "px," + _sw + "px," + (_sh - _imgTopMargin) + "px,0px)";
                    _this._img.style.visibility = "hidden";
                }
            }
            else {
                if (_outOfBounds) {
                    _outOfBounds = false;
                    _this._img.style.visibility = "visible";
                }
                _h = Math.max(_limitTop, Math.round(_sh * _localPercent));
                _this._img.style.clip = "rect(" + (_h - _imgTopMargin) + "px," + _sw + "px," + (_sh - _imgTopMargin) + "px,0px)";
            }
        }
    }
}

function movingText(_id, _element) {
    var _this = this;
    var _isAnimIn = false;
    var _circle = _element.firstChild.firstChild, _icon = _element.childNodes[1], _subHeader = _element.childNodes[2];

    _this.updateY = function (_areaScrolled) {
        //Check for being in view
        if (Math.round(_areaScrolled - 1) == _id) {
            if (!_isAnimIn) {
                _isAnimIn = true;
                _this.killTweens();
                TweenLite.to(_circle, 1.2, {drawSVG: "100%", ease: Strong.easeInOut});
                TweenLite.to(_icon, 0, {scale: 1.4});
                TweenLite.to(_icon, .8, {autoAlpha: 1, scale: 1, delay: .4, ease: Quad.easeInOut});
                TweenLite.to(_subHeader, .8, {autoAlpha: 1, delay: .3, ease: Quad.easeInOut});
            }
        }
        else {
            if (_isAnimIn) {
                _isAnimIn = false;
                _this.killTweens();
                TweenLite.to(_circle, 1.2, {drawSVG: "0%", ease: Strong.easeInOut});
                TweenLite.to(_icon, .8, {autoAlpha: 0, scale: .5, ease: Quad.easeInOut});
                TweenLite.to(_subHeader, .8, {autoAlpha: 0, ease: Quad.easeInOut});
            }
        }
    }
    _this.killTweens = function () {
        TweenLite.killTweensOf(_circle);
        TweenLite.killTweensOf(_icon);
        TweenLite.killTweensOf(_subHeader);
    }
    _this.simpleVersion = function () {
        _element.className = "H8FTSL";
    }
    _this.init = function () {
        TweenLite.to(_circle, 0, {drawSVG: "0% 0%"});
        //Create background image
        _icon.style.backgroundImage = 'url("' + H8getImg("Assets/Images/focus_" + (_id + 1) + ".png") + '")';
    }
}

function docuScrollB() {
    var _this = this;
    var _time = .6, _sh = 0;
    _this.scrollToText = function (_y) {
        //console.log("Scroll to: ", _y)
        var _distance = _y - jQuery(window).scrollTop();
        if (Math.abs(_distance) > _sh * .25) _time = .7;
        else _time = .4;
        TweenLite.to(window, _time, {scrollTo: {y: _y}, ease: Quad.easeInOut});
    }
    _this.resize = function (sh) {
        _sh = sh;
    }
}


function H8Events(elem, eventType, handler, add) {
    if (add) {
        if (elem.addEventListener) elem.addEventListener(eventType, handler, false);
        else if (elem.attachEvent) elem.attachEvent('on' + eventType, handler);
    }
    else {
        if (elem.removeEventListener) elem.removeEventListener(eventType, handler, false);
        else if (elem.detachEvent) elem.detachEvent('on' + eventType, handler);
    }
}
var _isLocal = false, _localGetQA = false;
function H8getImg(_input) {
    if (_isLocal) {
        if (!_localGetQA) return _input;
    }
    var _split = _input.split("/");
    if (_split.length > 1) _input = _input.split("/")[2];
    //var _prefix = "http://qa.beoplay.com/~/media/", _postfix = ".ashx";
    var _prefix = "/~/media/", _postfix = ".ashx";
    if (_input == "f1.jpg") return _prefix + "9297bc020705411bab15c065d1572029" + _postfix;
    else if (_input == "f2.jpg") return _prefix + "e8698c93c0e240fb83e9407d550c9f7f" + _postfix;
    else if (_input == "f3.jpg") return _prefix + "418adc7575a441159b2d84adbd293d4f" + _postfix;
    else if (_input == "f4.jpg") return _prefix + "9e6e0bef5ccf454a979d7a05d81ac6ac" + _postfix;
    else if (_input == "f5.jpg") return _prefix + "42dbcd4e2f6f4d92a117cb55b43df2be" + _postfix;
    else if (_input == "f6.jpg") return _prefix + "4cd8838c4cd3476bb42cc31b91c91502" + _postfix;
    else if (_input == "focus_3.png") return _prefix + "99ce57d29e2f48d49ade09b6c3b971a4" + _postfix;
    else if (_input == "focus_1l.png") return _prefix + "768A5EF337A3459BA3BDA86A94457518" + _postfix;
    else if (_input == "focus_2.png") return _prefix + "db561789157944f8af2c0148d52f97b4" + _postfix;
    else if (_input == "focus_2l.png") return _prefix + "dec6fd5cc96d49a9ac4d462703b14ce5" + _postfix;
    else if (_input == "focus_1.png") return _prefix + "ee0ccc7e45f1499d841538b780246561" + _postfix;
    else if (_input == "focus_3l.png") return _prefix + "fb98a7674c9f4f98ab8e86a4ae5703aa" + _postfix;
    else if (_input == "focus_4.png") return _prefix + "83fdd418e8014709920ac9be9ca69dc6" + _postfix;
    else if (_input == "focus_4l.png") return _prefix + "4a211bdd4684442794d05f54c271d7d8" + _postfix;
    else if (_input == "focus_5.png") return _prefix + "4a5253d147094675ab84870a1accd53c" + _postfix;
    else if (_input == "focus_5l.png") return _prefix + "3740bcb910754d6885ae084c8598c330" + _postfix;
    else if (_input == "focus_6.png") return _prefix + "3367c94789e744688363278834a4dded" + _postfix;
    else if (_input == "focus_6l.png") return _prefix + "2124e0863be1474b8c7ce7c06ad6e967" + _postfix;
    else if (_input == "poster.jpg") return _prefix + "a3d35476c2814b748f1cfd7c5a3927ff" + _postfix;
    else if (_input == "tv1.jpg") return _prefix + "c552a25b20c0442b8ed264180171fa20" + _postfix;
    else if (_input == "tv2.jpg") return _prefix + "b0007a24e33b4567bc101429e10da829" + _postfix;
    else if (_input == "tv3.jpg") return _prefix + "eb6f39fa38d04860aa147c9b23f2950e" + _postfix;
    else if (_input == "tv4.jpg") return _prefix + "0c6ab99d8c9f47a48d5ff2f3ce5d8813" + _postfix;
    else if (_input == "tv5.jpg") return _prefix + "5b402325f2c24725a37b91ad6942c4a5" + _postfix;
    else if (_input == "tv6.jpg") return _prefix + "74c0af1053544234ab7225dafca00270" + _postfix;
    return "unknown asset for: " + _input;
}

var H8 = {};
H8._isTouch = "ontouchstart" in window;
//DEBUG
//H8._isTouch = true;
//H8._isTouch = false;

H8._allowEngine = true;
H8._isIE = false;
H8._isSafari = false;
H8._isIEVersion = 10;
var _H8VideoModule;
var _H8FocusModule;
function checkJQ() {
    if (typeof jQuery == 'undefined') setTimeout(checkJQ, 100);
    else {
        H8._isIE = (jQuery.browser.msie == true);
        if (H8._isIE) H8._isIEVersion = parseFloat(jQuery.browser.version);
        if (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1) H8._isSafari = true;
        //console.log("IE: ", H8._isIE, " IE version: ", H8._isIEVersion , " Safari: ", H8._isSafari);
        _H8VideoModule = new H8VideoModule(false);
        _H8FocusModule = new H8FocusModule(false);
        //Call the resize function after 1 second (to make sure everything is measured correct)
        H8Events(window, "resize", delayedResize, true);
        setTimeout(resizeAgain, 1000);
        setTimeout(resizeAgain, 3000);
    }
}
function delayedResize(e) {
    setTimeout(_H8FocusModule.resize, 1000);
}
function resizeAgain() {
    _H8VideoModule.resize();
    _H8FocusModule.resize();
    setTimeout(_H8FocusModule.resize, 500);
}
checkJQ();

/*!
 * VERSION: 1.15.0
 * DATE: 2014-12-03
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 */
(function (t, e) {
    "use strict";
    var i = t.GreenSockGlobals = t.GreenSockGlobals || t;
    if (!i.TweenLite) {
        var s, r, n, a, o, l = function (t) {
            var e, s = t.split("."), r = i;
            for (e = 0; s.length > e; e++)r[s[e]] = r = r[s[e]] || {};
            return r
        }, h = l("com.greensock"), _ = 1e-10, u = function (t) {
            var e, i = [], s = t.length;
            for (e = 0; e !== s; i.push(t[e++]));
            return i
        }, m = function () {
        }, f = function () {
            var t = Object.prototype.toString, e = t.call([]);
            return function (i) {
                return null != i && (i instanceof Array || "object" == typeof i && !!i.push && t.call(i) === e)
            }
        }(), c = {}, p = function (s, r, n, a) {
            this.sc = c[s] ? c[s].sc : [], c[s] = this, this.gsClass = null, this.func = n;
            var o = [];
            this.check = function (h) {
                for (var _, u, m, f, d = r.length, v = d; --d > -1;)(_ = c[r[d]] || new p(r[d], [])).gsClass ? (o[d] = _.gsClass, v--) : h && _.sc.push(this);
                if (0 === v && n)for (u = ("com.greensock." + s).split("."), m = u.pop(), f = l(u.join("."))[m] = this.gsClass = n.apply(n, o), a && (i[m] = f, "function" == typeof define && define.amd ? define((t.GreenSockAMDPath ? t.GreenSockAMDPath + "/" : "") + s.split(".").pop(), [], function () {
                    return f
                }) : s === e && "undefined" != typeof module && module.exports && (module.exports = f)), d = 0; this.sc.length > d; d++)this.sc[d].check()
            }, this.check(!0)
        }, d = t._gsDefine = function (t, e, i, s) {
            return new p(t, e, i, s)
        }, v = h._class = function (t, e, i) {
            return e = e || function () {
            }, d(t, [], function () {
                return e
            }, i), e
        };
        d.globals = i;
        var g = [0, 0, 1, 1], T = [], y = v("easing.Ease", function (t, e, i, s) {
            this._func = t, this._type = i || 0, this._power = s || 0, this._params = e ? g.concat(e) : g
        }, !0), w = y.map = {}, P = y.register = function (t, e, i, s) {
            for (var r, n, a, o, l = e.split(","), _ = l.length, u = (i || "easeIn,easeOut,easeInOut").split(","); --_ > -1;)for (n = l[_], r = s ? v("easing." + n, null, !0) : h.easing[n] || {}, a = u.length; --a > -1;)o = u[a], w[n + "." + o] = w[o + n] = r[o] = t.getRatio ? t : t[o] || new t
        };
        for (n = y.prototype, n._calcEnd = !1, n.getRatio = function (t) {
            if (this._func)return this._params[0] = t, this._func.apply(null, this._params);
            var e = this._type, i = this._power, s = 1 === e ? 1 - t : 2 === e ? t : .5 > t ? 2 * t : 2 * (1 - t);
            return 1 === i ? s *= s : 2 === i ? s *= s * s : 3 === i ? s *= s * s * s : 4 === i && (s *= s * s * s * s), 1 === e ? 1 - s : 2 === e ? s : .5 > t ? s / 2 : 1 - s / 2
        }, s = ["Linear", "Quad", "Cubic", "Quart", "Quint,Strong"], r = s.length; --r > -1;)n = s[r] + ",Power" + r, P(new y(null, null, 1, r), n, "easeOut", !0), P(new y(null, null, 2, r), n, "easeIn" + (0 === r ? ",easeNone" : "")), P(new y(null, null, 3, r), n, "easeInOut");
        w.linear = h.easing.Linear.easeIn, w.swing = h.easing.Quad.easeInOut;
        var b = v("events.EventDispatcher", function (t) {
            this._listeners = {}, this._eventTarget = t || this
        });
        n = b.prototype, n.addEventListener = function (t, e, i, s, r) {
            r = r || 0;
            var n, l, h = this._listeners[t], _ = 0;
            for (null == h && (this._listeners[t] = h = []), l = h.length; --l > -1;)n = h[l], n.c === e && n.s === i ? h.splice(l, 1) : 0 === _ && r > n.pr && (_ = l + 1);
            h.splice(_, 0, {c: e, s: i, up: s, pr: r}), this !== a || o || a.wake()
        }, n.removeEventListener = function (t, e) {
            var i, s = this._listeners[t];
            if (s)for (i = s.length; --i > -1;)if (s[i].c === e)return s.splice(i, 1), void 0
        }, n.dispatchEvent = function (t) {
            var e, i, s, r = this._listeners[t];
            if (r)for (e = r.length, i = this._eventTarget; --e > -1;)s = r[e], s && (s.up ? s.c.call(s.s || i, {
                type: t,
                target: i
            }) : s.c.call(s.s || i))
        };
        var k = t.requestAnimationFrame, A = t.cancelAnimationFrame, S = Date.now || function () {
                return (new Date).getTime()
            }, x = S();
        for (s = ["ms", "moz", "webkit", "o"], r = s.length; --r > -1 && !k;)k = t[s[r] + "RequestAnimationFrame"], A = t[s[r] + "CancelAnimationFrame"] || t[s[r] + "CancelRequestAnimationFrame"];
        v("Ticker", function (t, e) {
            var i, s, r, n, l, h = this, u = S(), f = e !== !1 && k, c = 500, p = 33, d = "tick", v = function (t) {
                var e, a, o = S() - x;
                o > c && (u += o - p), x += o, h.time = (x - u) / 1e3, e = h.time - l, (!i || e > 0 || t === !0) && (h.frame++, l += e + (e >= n ? .004 : n - e), a = !0), t !== !0 && (r = s(v)), a && h.dispatchEvent(d)
            };
            b.call(h), h.time = h.frame = 0, h.tick = function () {
                v(!0)
            }, h.lagSmoothing = function (t, e) {
                c = t || 1 / _, p = Math.min(e, c, 0)
            }, h.sleep = function () {
                null != r && (f && A ? A(r) : clearTimeout(r), s = m, r = null, h === a && (o = !1))
            }, h.wake = function () {
                null !== r ? h.sleep() : h.frame > 10 && (x = S() - c + 5), s = 0 === i ? m : f && k ? k : function (t) {
                    return setTimeout(t, 0 | 1e3 * (l - h.time) + 1)
                }, h === a && (o = !0), v(2)
            }, h.fps = function (t) {
                return arguments.length ? (i = t, n = 1 / (i || 60), l = this.time + n, h.wake(), void 0) : i
            }, h.useRAF = function (t) {
                return arguments.length ? (h.sleep(), f = t, h.fps(i), void 0) : f
            }, h.fps(t), setTimeout(function () {
                f && (!r || 5 > h.frame) && h.useRAF(!1)
            }, 1500)
        }), n = h.Ticker.prototype = new h.events.EventDispatcher, n.constructor = h.Ticker;
        var R = v("core.Animation", function (t, e) {
            if (this.vars = e = e || {}, this._duration = this._totalDuration = t || 0, this._delay = Number(e.delay) || 0, this._timeScale = 1, this._active = e.immediateRender === !0, this.data = e.data, this._reversed = e.reversed === !0, B) {
                o || a.wake();
                var i = this.vars.useFrames ? q : B;
                i.add(this, i._time), this.vars.paused && this.paused(!0)
            }
        });
        a = R.ticker = new h.Ticker, n = R.prototype, n._dirty = n._gc = n._initted = n._paused = !1, n._totalTime = n._time = 0, n._rawPrevTime = -1, n._next = n._last = n._onUpdate = n._timeline = n.timeline = null, n._paused = !1;
        var C = function () {
            o && S() - x > 2e3 && a.wake(), setTimeout(C, 2e3)
        };
        C(), n.play = function (t, e) {
            return null != t && this.seek(t, e), this.reversed(!1).paused(!1)
        }, n.pause = function (t, e) {
            return null != t && this.seek(t, e), this.paused(!0)
        }, n.resume = function (t, e) {
            return null != t && this.seek(t, e), this.paused(!1)
        }, n.seek = function (t, e) {
            return this.totalTime(Number(t), e !== !1)
        }, n.restart = function (t, e) {
            return this.reversed(!1).paused(!1).totalTime(t ? -this._delay : 0, e !== !1, !0)
        }, n.reverse = function (t, e) {
            return null != t && this.seek(t || this.totalDuration(), e), this.reversed(!0).paused(!1)
        }, n.render = function () {
        }, n.invalidate = function () {
            return this._time = this._totalTime = 0, this._initted = this._gc = !1, this._rawPrevTime = -1, (this._gc || !this.timeline) && this._enabled(!0), this
        }, n.isActive = function () {
            var t, e = this._timeline, i = this._startTime;
            return !e || !this._gc && !this._paused && e.isActive() && (t = e.rawTime()) >= i && i + this.totalDuration() / this._timeScale > t
        }, n._enabled = function (t, e) {
            return o || a.wake(), this._gc = !t, this._active = this.isActive(), e !== !0 && (t && !this.timeline ? this._timeline.add(this, this._startTime - this._delay) : !t && this.timeline && this._timeline._remove(this, !0)), !1
        }, n._kill = function () {
            return this._enabled(!1, !1)
        }, n.kill = function (t, e) {
            return this._kill(t, e), this
        }, n._uncache = function (t) {
            for (var e = t ? this : this.timeline; e;)e._dirty = !0, e = e.timeline;
            return this
        }, n._swapSelfInParams = function (t) {
            for (var e = t.length, i = t.concat(); --e > -1;)"{self}" === t[e] && (i[e] = this);
            return i
        }, n.eventCallback = function (t, e, i, s) {
            if ("on" === (t || "").substr(0, 2)) {
                var r = this.vars;
                if (1 === arguments.length)return r[t];
                null == e ? delete r[t] : (r[t] = e, r[t + "Params"] = f(i) && -1 !== i.join("").indexOf("{self}") ? this._swapSelfInParams(i) : i, r[t + "Scope"] = s), "onUpdate" === t && (this._onUpdate = e)
            }
            return this
        }, n.delay = function (t) {
            return arguments.length ? (this._timeline.smoothChildTiming && this.startTime(this._startTime + t - this._delay), this._delay = t, this) : this._delay
        }, n.duration = function (t) {
            return arguments.length ? (this._duration = this._totalDuration = t, this._uncache(!0), this._timeline.smoothChildTiming && this._time > 0 && this._time < this._duration && 0 !== t && this.totalTime(this._totalTime * (t / this._duration), !0), this) : (this._dirty = !1, this._duration)
        }, n.totalDuration = function (t) {
            return this._dirty = !1, arguments.length ? this.duration(t) : this._totalDuration
        }, n.time = function (t, e) {
            return arguments.length ? (this._dirty && this.totalDuration(), this.totalTime(t > this._duration ? this._duration : t, e)) : this._time
        }, n.totalTime = function (t, e, i) {
            if (o || a.wake(), !arguments.length)return this._totalTime;
            if (this._timeline) {
                if (0 > t && !i && (t += this.totalDuration()), this._timeline.smoothChildTiming) {
                    this._dirty && this.totalDuration();
                    var s = this._totalDuration, r = this._timeline;
                    if (t > s && !i && (t = s), this._startTime = (this._paused ? this._pauseTime : r._time) - (this._reversed ? s - t : t) / this._timeScale, r._dirty || this._uncache(!1), r._timeline)for (; r._timeline;)r._timeline._time !== (r._startTime + r._totalTime) / r._timeScale && r.totalTime(r._totalTime, !0), r = r._timeline
                }
                this._gc && this._enabled(!0, !1), (this._totalTime !== t || 0 === this._duration) && (this.render(t, e, !1), z.length && M())
            }
            return this
        }, n.progress = n.totalProgress = function (t, e) {
            return arguments.length ? this.totalTime(this.duration() * t, e) : this._time / this.duration()
        }, n.startTime = function (t) {
            return arguments.length ? (t !== this._startTime && (this._startTime = t, this.timeline && this.timeline._sortChildren && this.timeline.add(this, t - this._delay)), this) : this._startTime
        }, n.endTime = function (t) {
            return this._startTime + (0 != t ? this.totalDuration() : this.duration()) / this._timeScale
        }, n.timeScale = function (t) {
            if (!arguments.length)return this._timeScale;
            if (t = t || _, this._timeline && this._timeline.smoothChildTiming) {
                var e = this._pauseTime, i = e || 0 === e ? e : this._timeline.totalTime();
                this._startTime = i - (i - this._startTime) * this._timeScale / t
            }
            return this._timeScale = t, this._uncache(!1)
        }, n.reversed = function (t) {
            return arguments.length ? (t != this._reversed && (this._reversed = t, this.totalTime(this._timeline && !this._timeline.smoothChildTiming ? this.totalDuration() - this._totalTime : this._totalTime, !0)), this) : this._reversed
        }, n.paused = function (t) {
            if (!arguments.length)return this._paused;
            if (t != this._paused && this._timeline) {
                o || t || a.wake();
                var e = this._timeline, i = e.rawTime(), s = i - this._pauseTime;
                !t && e.smoothChildTiming && (this._startTime += s, this._uncache(!1)), this._pauseTime = t ? i : null, this._paused = t, this._active = this.isActive(), !t && 0 !== s && this._initted && this.duration() && this.render(e.smoothChildTiming ? this._totalTime : (i - this._startTime) / this._timeScale, !0, !0)
            }
            return this._gc && !t && this._enabled(!0, !1), this
        };
        var D = v("core.SimpleTimeline", function (t) {
            R.call(this, 0, t), this.autoRemoveChildren = this.smoothChildTiming = !0
        });
        n = D.prototype = new R, n.constructor = D, n.kill()._gc = !1, n._first = n._last = n._recent = null, n._sortChildren = !1, n.add = n.insert = function (t, e) {
            var i, s;
            if (t._startTime = Number(e || 0) + t._delay, t._paused && this !== t._timeline && (t._pauseTime = t._startTime + (this.rawTime() - t._startTime) / t._timeScale), t.timeline && t.timeline._remove(t, !0), t.timeline = t._timeline = this, t._gc && t._enabled(!0, !0), i = this._last, this._sortChildren)for (s = t._startTime; i && i._startTime > s;)i = i._prev;
            return i ? (t._next = i._next, i._next = t) : (t._next = this._first, this._first = t), t._next ? t._next._prev = t : this._last = t, t._prev = i, this._recent = t, this._timeline && this._uncache(!0), this
        }, n._remove = function (t, e) {
            return t.timeline === this && (e || t._enabled(!1, !0), t._prev ? t._prev._next = t._next : this._first === t && (this._first = t._next), t._next ? t._next._prev = t._prev : this._last === t && (this._last = t._prev), t._next = t._prev = t.timeline = null, t === this._recent && (this._recent = this._last), this._timeline && this._uncache(!0)), this
        }, n.render = function (t, e, i) {
            var s, r = this._first;
            for (this._totalTime = this._time = this._rawPrevTime = t; r;)s = r._next, (r._active || t >= r._startTime && !r._paused) && (r._reversed ? r.render((r._dirty ? r.totalDuration() : r._totalDuration) - (t - r._startTime) * r._timeScale, e, i) : r.render((t - r._startTime) * r._timeScale, e, i)), r = s
        }, n.rawTime = function () {
            return o || a.wake(), this._totalTime
        };
        var I = v("TweenLite", function (e, i, s) {
            if (R.call(this, i, s), this.render = I.prototype.render, null == e)throw"Cannot tween a null target.";
            this.target = e = "string" != typeof e ? e : I.selector(e) || e;
            var r, n, a, o = e.jquery || e.length && e !== t && e[0] && (e[0] === t || e[0].nodeType && e[0].style && !e.nodeType), l = this.vars.overwrite;
            if (this._overwrite = l = null == l ? Q[I.defaultOverwrite] : "number" == typeof l ? l >> 0 : Q[l], (o || e instanceof Array || e.push && f(e)) && "number" != typeof e[0])for (this._targets = a = u(e), this._propLookup = [], this._siblings = [], r = 0; a.length > r; r++)n = a[r], n ? "string" != typeof n ? n.length && n !== t && n[0] && (n[0] === t || n[0].nodeType && n[0].style && !n.nodeType) ? (a.splice(r--, 1), this._targets = a = a.concat(u(n))) : (this._siblings[r] = $(n, this, !1), 1 === l && this._siblings[r].length > 1 && H(n, this, null, 1, this._siblings[r])) : (n = a[r--] = I.selector(n), "string" == typeof n && a.splice(r + 1, 1)) : a.splice(r--, 1); else this._propLookup = {}, this._siblings = $(e, this, !1), 1 === l && this._siblings.length > 1 && H(e, this, null, 1, this._siblings);
            (this.vars.immediateRender || 0 === i && 0 === this._delay && this.vars.immediateRender !== !1) && (this._time = -_, this.render(-this._delay))
        }, !0), E = function (e) {
            return e && e.length && e !== t && e[0] && (e[0] === t || e[0].nodeType && e[0].style && !e.nodeType)
        }, O = function (t, e) {
            var i, s = {};
            for (i in t)G[i] || i in e && "transform" !== i && "x" !== i && "y" !== i && "width" !== i && "height" !== i && "className" !== i && "border" !== i || !(!U[i] || U[i] && U[i]._autoCSS) || (s[i] = t[i], delete t[i]);
            t.css = s
        };
        n = I.prototype = new R, n.constructor = I, n.kill()._gc = !1, n.ratio = 0, n._firstPT = n._targets = n._overwrittenProps = n._startAt = null, n._notifyPluginsOfEnabled = n._lazy = !1, I.version = "1.15.0", I.defaultEase = n._ease = new y(null, null, 1, 1), I.defaultOverwrite = "auto", I.ticker = a, I.autoSleep = !0, I.lagSmoothing = function (t, e) {
            a.lagSmoothing(t, e)
        }, I.selector = t.$ || t.jQuery || function (e) {
            var i = t.$ || t.jQuery;
            return i ? (I.selector = i, i(e)) : "undefined" == typeof document ? e : document.querySelectorAll ? document.querySelectorAll(e) : document.getElementById("#" === e.charAt(0) ? e.substr(1) : e)
        };
        var z = [], L = {}, N = I._internals = {
            isArray: f,
            isSelector: E,
            lazyTweens: z
        }, U = I._plugins = {}, F = N.tweenLookup = {}, j = 0, G = N.reservedProps = {
            ease: 1,
            delay: 1,
            overwrite: 1,
            onComplete: 1,
            onCompleteParams: 1,
            onCompleteScope: 1,
            useFrames: 1,
            runBackwards: 1,
            startAt: 1,
            onUpdate: 1,
            onUpdateParams: 1,
            onUpdateScope: 1,
            onStart: 1,
            onStartParams: 1,
            onStartScope: 1,
            onReverseComplete: 1,
            onReverseCompleteParams: 1,
            onReverseCompleteScope: 1,
            onRepeat: 1,
            onRepeatParams: 1,
            onRepeatScope: 1,
            easeParams: 1,
            yoyo: 1,
            immediateRender: 1,
            repeat: 1,
            repeatDelay: 1,
            data: 1,
            paused: 1,
            reversed: 1,
            autoCSS: 1,
            lazy: 1,
            onOverwrite: 1
        }, Q = {
            none: 0,
            all: 1,
            auto: 2,
            concurrent: 3,
            allOnStart: 4,
            preexisting: 5,
            "true": 1,
            "false": 0
        }, q = R._rootFramesTimeline = new D, B = R._rootTimeline = new D, M = N.lazyRender = function () {
            var t, e = z.length;
            for (L = {}; --e > -1;)t = z[e], t && t._lazy !== !1 && (t.render(t._lazy[0], t._lazy[1], !0), t._lazy = !1);
            z.length = 0
        };
        B._startTime = a.time, q._startTime = a.frame, B._active = q._active = !0, setTimeout(M, 1), R._updateRoot = I.render = function () {
            var t, e, i;
            if (z.length && M(), B.render((a.time - B._startTime) * B._timeScale, !1, !1), q.render((a.frame - q._startTime) * q._timeScale, !1, !1), z.length && M(), !(a.frame % 120)) {
                for (i in F) {
                    for (e = F[i].tweens, t = e.length; --t > -1;)e[t]._gc && e.splice(t, 1);
                    0 === e.length && delete F[i]
                }
                if (i = B._first, (!i || i._paused) && I.autoSleep && !q._first && 1 === a._listeners.tick.length) {
                    for (; i && i._paused;)i = i._next;
                    i || a.sleep()
                }
            }
        }, a.addEventListener("tick", R._updateRoot);
        var $ = function (t, e, i) {
            var s, r, n = t._gsTweenID;
            if (F[n || (t._gsTweenID = n = "t" + j++)] || (F[n] = {
                    target: t,
                    tweens: []
                }), e && (s = F[n].tweens, s[r = s.length] = e, i))for (; --r > -1;)s[r] === e && s.splice(r, 1);
            return F[n].tweens
        }, K = function (t, e, i, s) {
            var r, n, a = t.vars.onOverwrite;
            return a && (r = a(t, e, i, s)), a = I.onOverwrite, a && (n = a(t, e, i, s)), r !== !1 && n !== !1
        }, H = function (t, e, i, s, r) {
            var n, a, o, l;
            if (1 === s || s >= 4) {
                for (l = r.length, n = 0; l > n; n++)if ((o = r[n]) !== e)o._gc || K(o, e) && o._enabled(!1, !1) && (a = !0); else if (5 === s)break;
                return a
            }
            var h, u = e._startTime + _, m = [], f = 0, c = 0 === e._duration;
            for (n = r.length; --n > -1;)(o = r[n]) === e || o._gc || o._paused || (o._timeline !== e._timeline ? (h = h || J(e, 0, c), 0 === J(o, h, c) && (m[f++] = o)) : u >= o._startTime && o._startTime + o.totalDuration() / o._timeScale > u && ((c || !o._initted) && 2e-10 >= u - o._startTime || (m[f++] = o)));
            for (n = f; --n > -1;)if (o = m[n], 2 === s && o._kill(i, t, e) && (a = !0), 2 !== s || !o._firstPT && o._initted) {
                if (2 !== s && !K(o, e))continue;
                o._enabled(!1, !1) && (a = !0)
            }
            return a
        }, J = function (t, e, i) {
            for (var s = t._timeline, r = s._timeScale, n = t._startTime; s._timeline;) {
                if (n += s._startTime, r *= s._timeScale, s._paused)return -100;
                s = s._timeline
            }
            return n /= r, n > e ? n - e : i && n === e || !t._initted && 2 * _ > n - e ? _ : (n += t.totalDuration() / t._timeScale / r) > e + _ ? 0 : n - e - _
        };
        n._init = function () {
            var t, e, i, s, r, n = this.vars, a = this._overwrittenProps, o = this._duration, l = !!n.immediateRender, h = n.ease;
            if (n.startAt) {
                this._startAt && (this._startAt.render(-1, !0), this._startAt.kill()), r = {};
                for (s in n.startAt)r[s] = n.startAt[s];
                if (r.overwrite = !1, r.immediateRender = !0, r.lazy = l && n.lazy !== !1, r.startAt = r.delay = null, this._startAt = I.to(this.target, 0, r), l)if (this._time > 0)this._startAt = null; else if (0 !== o)return
            } else if (n.runBackwards && 0 !== o)if (this._startAt)this._startAt.render(-1, !0), this._startAt.kill(), this._startAt = null; else {
                0 !== this._time && (l = !1), i = {};
                for (s in n)G[s] && "autoCSS" !== s || (i[s] = n[s]);
                if (i.overwrite = 0, i.data = "isFromStart", i.lazy = l && n.lazy !== !1, i.immediateRender = l, this._startAt = I.to(this.target, 0, i), l) {
                    if (0 === this._time)return
                } else this._startAt._init(), this._startAt._enabled(!1), this.vars.immediateRender && (this._startAt = null)
            }
            if (this._ease = h = h ? h instanceof y ? h : "function" == typeof h ? new y(h, n.easeParams) : w[h] || I.defaultEase : I.defaultEase, n.easeParams instanceof Array && h.config && (this._ease = h.config.apply(h, n.easeParams)), this._easeType = this._ease._type, this._easePower = this._ease._power, this._firstPT = null, this._targets)for (t = this._targets.length; --t > -1;)this._initProps(this._targets[t], this._propLookup[t] = {}, this._siblings[t], a ? a[t] : null) && (e = !0); else e = this._initProps(this.target, this._propLookup, this._siblings, a);
            if (e && I._onPluginEvent("_onInitAllProps", this), a && (this._firstPT || "function" != typeof this.target && this._enabled(!1, !1)), n.runBackwards)for (i = this._firstPT; i;)i.s += i.c, i.c = -i.c, i = i._next;
            this._onUpdate = n.onUpdate, this._initted = !0
        }, n._initProps = function (e, i, s, r) {
            var n, a, o, l, h, _;
            if (null == e)return !1;
            L[e._gsTweenID] && M(), this.vars.css || e.style && e !== t && e.nodeType && U.css && this.vars.autoCSS !== !1 && O(this.vars, e);
            for (n in this.vars) {
                if (_ = this.vars[n], G[n])_ && (_ instanceof Array || _.push && f(_)) && -1 !== _.join("").indexOf("{self}") && (this.vars[n] = _ = this._swapSelfInParams(_, this)); else if (U[n] && (l = new U[n])._onInitTween(e, this.vars[n], this)) {
                    for (this._firstPT = h = {
                        _next: this._firstPT,
                        t: l,
                        p: "setRatio",
                        s: 0,
                        c: 1,
                        f: !0,
                        n: n,
                        pg: !0,
                        pr: l._priority
                    }, a = l._overwriteProps.length; --a > -1;)i[l._overwriteProps[a]] = this._firstPT;
                    (l._priority || l._onInitAllProps) && (o = !0), (l._onDisable || l._onEnable) && (this._notifyPluginsOfEnabled = !0)
                } else this._firstPT = i[n] = h = {
                    _next: this._firstPT,
                    t: e,
                    p: n,
                    f: "function" == typeof e[n],
                    n: n,
                    pg: !1,
                    pr: 0
                }, h.s = h.f ? e[n.indexOf("set") || "function" != typeof e["get" + n.substr(3)] ? n : "get" + n.substr(3)]() : parseFloat(e[n]), h.c = "string" == typeof _ && "=" === _.charAt(1) ? parseInt(_.charAt(0) + "1", 10) * Number(_.substr(2)) : Number(_) - h.s || 0;
                h && h._next && (h._next._prev = h)
            }
            return r && this._kill(r, e) ? this._initProps(e, i, s, r) : this._overwrite > 1 && this._firstPT && s.length > 1 && H(e, this, i, this._overwrite, s) ? (this._kill(i, e), this._initProps(e, i, s, r)) : (this._firstPT && (this.vars.lazy !== !1 && this._duration || this.vars.lazy && !this._duration) && (L[e._gsTweenID] = !0), o)
        }, n.render = function (t, e, i) {
            var s, r, n, a, o = this._time, l = this._duration, h = this._rawPrevTime;
            if (t >= l)this._totalTime = this._time = l, this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1, this._reversed || (s = !0, r = "onComplete"), 0 === l && (this._initted || !this.vars.lazy || i) && (this._startTime === this._timeline._duration && (t = 0), (0 === t || 0 > h || h === _ && "isPause" !== this.data) && h !== t && (i = !0, h > _ && (r = "onReverseComplete")), this._rawPrevTime = a = !e || t || h === t ? t : _); else if (1e-7 > t)this._totalTime = this._time = 0, this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0, (0 !== o || 0 === l && h > 0 && h !== _) && (r = "onReverseComplete", s = this._reversed), 0 > t && (this._active = !1, 0 === l && (this._initted || !this.vars.lazy || i) && (h >= 0 && (h !== _ || "isPause" !== this.data) && (i = !0), this._rawPrevTime = a = !e || t || h === t ? t : _)), this._initted || (i = !0); else if (this._totalTime = this._time = t, this._easeType) {
                var u = t / l, m = this._easeType, f = this._easePower;
                (1 === m || 3 === m && u >= .5) && (u = 1 - u), 3 === m && (u *= 2), 1 === f ? u *= u : 2 === f ? u *= u * u : 3 === f ? u *= u * u * u : 4 === f && (u *= u * u * u * u), this.ratio = 1 === m ? 1 - u : 2 === m ? u : .5 > t / l ? u / 2 : 1 - u / 2
            } else this.ratio = this._ease.getRatio(t / l);
            if (this._time !== o || i) {
                if (!this._initted) {
                    if (this._init(), !this._initted || this._gc)return;
                    if (!i && this._firstPT && (this.vars.lazy !== !1 && this._duration || this.vars.lazy && !this._duration))return this._time = this._totalTime = o, this._rawPrevTime = h, z.push(this), this._lazy = [t, e], void 0;
                    this._time && !s ? this.ratio = this._ease.getRatio(this._time / l) : s && this._ease._calcEnd && (this.ratio = this._ease.getRatio(0 === this._time ? 0 : 1))
                }
                for (this._lazy !== !1 && (this._lazy = !1), this._active || !this._paused && this._time !== o && t >= 0 && (this._active = !0), 0 === o && (this._startAt && (t >= 0 ? this._startAt.render(t, e, i) : r || (r = "_dummyGS")), this.vars.onStart && (0 !== this._time || 0 === l) && (e || this.vars.onStart.apply(this.vars.onStartScope || this, this.vars.onStartParams || T))), n = this._firstPT; n;)n.f ? n.t[n.p](n.c * this.ratio + n.s) : n.t[n.p] = n.c * this.ratio + n.s, n = n._next;
                this._onUpdate && (0 > t && this._startAt && t !== -1e-4 && this._startAt.render(t, e, i), e || (this._time !== o || s) && this._onUpdate.apply(this.vars.onUpdateScope || this, this.vars.onUpdateParams || T)), r && (!this._gc || i) && (0 > t && this._startAt && !this._onUpdate && t !== -1e-4 && this._startAt.render(t, e, i), s && (this._timeline.autoRemoveChildren && this._enabled(!1, !1), this._active = !1), !e && this.vars[r] && this.vars[r].apply(this.vars[r + "Scope"] || this, this.vars[r + "Params"] || T), 0 === l && this._rawPrevTime === _ && a !== _ && (this._rawPrevTime = 0))
            }
        }, n._kill = function (t, e, i) {
            if ("all" === t && (t = null), null == t && (null == e || e === this.target))return this._lazy = !1, this._enabled(!1, !1);
            e = "string" != typeof e ? e || this._targets || this.target : I.selector(e) || e;
            var s, r, n, a, o, l, h, _, u;
            if ((f(e) || E(e)) && "number" != typeof e[0])for (s = e.length; --s > -1;)this._kill(t, e[s]) && (l = !0); else {
                if (this._targets) {
                    for (s = this._targets.length; --s > -1;)if (e === this._targets[s]) {
                        o = this._propLookup[s] || {}, this._overwrittenProps = this._overwrittenProps || [], r = this._overwrittenProps[s] = t ? this._overwrittenProps[s] || {} : "all";
                        break
                    }
                } else {
                    if (e !== this.target)return !1;
                    o = this._propLookup, r = this._overwrittenProps = t ? this._overwrittenProps || {} : "all"
                }
                if (o) {
                    if (h = t || o, _ = t !== r && "all" !== r && t !== o && ("object" != typeof t || !t._tempKill), i && (I.onOverwrite || this.vars.onOverwrite)) {
                        for (n in h)o[n] && (u || (u = []), u.push(n));
                        if (!K(this, i, e, u))return !1
                    }
                    for (n in h)(a = o[n]) && (a.pg && a.t._kill(h) && (l = !0), a.pg && 0 !== a.t._overwriteProps.length || (a._prev ? a._prev._next = a._next : a === this._firstPT && (this._firstPT = a._next), a._next && (a._next._prev = a._prev), a._next = a._prev = null), delete o[n]), _ && (r[n] = 1);
                    !this._firstPT && this._initted && this._enabled(!1, !1)
                }
            }
            return l
        }, n.invalidate = function () {
            return this._notifyPluginsOfEnabled && I._onPluginEvent("_onDisable", this), this._firstPT = this._overwrittenProps = this._startAt = this._onUpdate = null, this._notifyPluginsOfEnabled = this._active = this._lazy = !1, this._propLookup = this._targets ? {} : [], R.prototype.invalidate.call(this), this.vars.immediateRender && (this._time = -_, this.render(-this._delay)), this
        }, n._enabled = function (t, e) {
            if (o || a.wake(), t && this._gc) {
                var i, s = this._targets;
                if (s)for (i = s.length; --i > -1;)this._siblings[i] = $(s[i], this, !0); else this._siblings = $(this.target, this, !0)
            }
            return R.prototype._enabled.call(this, t, e), this._notifyPluginsOfEnabled && this._firstPT ? I._onPluginEvent(t ? "_onEnable" : "_onDisable", this) : !1
        }, I.to = function (t, e, i) {
            return new I(t, e, i)
        }, I.from = function (t, e, i) {
            return i.runBackwards = !0, i.immediateRender = 0 != i.immediateRender, new I(t, e, i)
        }, I.fromTo = function (t, e, i, s) {
            return s.startAt = i, s.immediateRender = 0 != s.immediateRender && 0 != i.immediateRender, new I(t, e, s)
        }, I.delayedCall = function (t, e, i, s, r) {
            return new I(e, 0, {
                delay: t,
                onComplete: e,
                onCompleteParams: i,
                onCompleteScope: s,
                onReverseComplete: e,
                onReverseCompleteParams: i,
                onReverseCompleteScope: s,
                immediateRender: !1,
                lazy: !1,
                useFrames: r,
                overwrite: 0
            })
        }, I.set = function (t, e) {
            return new I(t, 0, e)
        }, I.getTweensOf = function (t, e) {
            if (null == t)return [];
            t = "string" != typeof t ? t : I.selector(t) || t;
            var i, s, r, n;
            if ((f(t) || E(t)) && "number" != typeof t[0]) {
                for (i = t.length, s = []; --i > -1;)s = s.concat(I.getTweensOf(t[i], e));
                for (i = s.length; --i > -1;)for (n = s[i], r = i; --r > -1;)n === s[r] && s.splice(i, 1)
            } else for (s = $(t).concat(), i = s.length; --i > -1;)(s[i]._gc || e && !s[i].isActive()) && s.splice(i, 1);
            return s
        }, I.killTweensOf = I.killDelayedCallsTo = function (t, e, i) {
            "object" == typeof e && (i = e, e = !1);
            for (var s = I.getTweensOf(t, e), r = s.length; --r > -1;)s[r]._kill(i, t)
        };
        var V = v("plugins.TweenPlugin", function (t, e) {
            this._overwriteProps = (t || "").split(","), this._propName = this._overwriteProps[0], this._priority = e || 0, this._super = V.prototype
        }, !0);
        if (n = V.prototype, V.version = "1.10.1", V.API = 2, n._firstPT = null, n._addTween = function (t, e, i, s, r, n) {
                var a, o;
                return null != s && (a = "number" == typeof s || "=" !== s.charAt(1) ? Number(s) - i : parseInt(s.charAt(0) + "1", 10) * Number(s.substr(2))) ? (this._firstPT = o = {
                    _next: this._firstPT,
                    t: t,
                    p: e,
                    s: i,
                    c: a,
                    f: "function" == typeof t[e],
                    n: r || e,
                    r: n
                }, o._next && (o._next._prev = o), o) : void 0
            }, n.setRatio = function (t) {
                for (var e, i = this._firstPT, s = 1e-6; i;)e = i.c * t + i.s, i.r ? e = Math.round(e) : s > e && e > -s && (e = 0), i.f ? i.t[i.p](e) : i.t[i.p] = e, i = i._next
            }, n._kill = function (t) {
                var e, i = this._overwriteProps, s = this._firstPT;
                if (null != t[this._propName])this._overwriteProps = []; else for (e = i.length; --e > -1;)null != t[i[e]] && i.splice(e, 1);
                for (; s;)null != t[s.n] && (s._next && (s._next._prev = s._prev), s._prev ? (s._prev._next = s._next, s._prev = null) : this._firstPT === s && (this._firstPT = s._next)), s = s._next;
                return !1
            }, n._roundProps = function (t, e) {
                for (var i = this._firstPT; i;)(t[this._propName] || null != i.n && t[i.n.split(this._propName + "_").join("")]) && (i.r = e), i = i._next
            }, I._onPluginEvent = function (t, e) {
                var i, s, r, n, a, o = e._firstPT;
                if ("_onInitAllProps" === t) {
                    for (; o;) {
                        for (a = o._next, s = r; s && s.pr > o.pr;)s = s._next;
                        (o._prev = s ? s._prev : n) ? o._prev._next = o : r = o, (o._next = s) ? s._prev = o : n = o, o = a
                    }
                    o = e._firstPT = r
                }
                for (; o;)o.pg && "function" == typeof o.t[t] && o.t[t]() && (i = !0), o = o._next;
                return i
            }, V.activate = function (t) {
                for (var e = t.length; --e > -1;)t[e].API === V.API && (U[(new t[e])._propName] = t[e]);
                return !0
            }, d.plugin = function (t) {
                if (!(t && t.propName && t.init && t.API))throw"illegal plugin definition.";
                var e, i = t.propName, s = t.priority || 0, r = t.overwriteProps, n = {
                    init: "_onInitTween",
                    set: "setRatio",
                    kill: "_kill",
                    round: "_roundProps",
                    initAll: "_onInitAllProps"
                }, a = v("plugins." + i.charAt(0).toUpperCase() + i.substr(1) + "Plugin", function () {
                    V.call(this, i, s), this._overwriteProps = r || []
                }, t.global === !0), o = a.prototype = new V(i);
                o.constructor = a, a.API = t.API;
                for (e in n)"function" == typeof t[e] && (o[n[e]] = t[e]);
                return a.version = t.version, V.activate([a]), a
            }, s = t._gsQueue) {
            for (r = 0; s.length > r; r++)s[r]();
            for (n in c)c[n].func || t.console.log("GSAP encountered missing dependency: com.greensock." + n)
        }
        o = !1
    }
})("undefined" != typeof module && module.exports && "undefined" != typeof global ? global : this || window, "TweenLite");
/*!
 * VERSION: beta 1.9.4
 * DATE: 2014-07-17
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 **/
var _gsScope = "undefined" != typeof module && module.exports && "undefined" != typeof global ? global : this || window;
(_gsScope._gsQueue || (_gsScope._gsQueue = [])).push(function () {
    "use strict";
    _gsScope._gsDefine("easing.Back", ["easing.Ease"], function (t) {
        var e, i, s, r = _gsScope.GreenSockGlobals || _gsScope, n = r.com.greensock, a = 2 * Math.PI, o = Math.PI / 2, h = n._class, l = function (e, i) {
            var s = h("easing." + e, function () {
            }, !0), r = s.prototype = new t;
            return r.constructor = s, r.getRatio = i, s
        }, _ = t.register || function () {
            }, u = function (t, e, i, s) {
            var r = h("easing." + t, {easeOut: new e, easeIn: new i, easeInOut: new s}, !0);
            return _(r, t), r
        }, c = function (t, e, i) {
            this.t = t, this.v = e, i && (this.next = i, i.prev = this, this.c = i.v - e, this.gap = i.t - t)
        }, p = function (e, i) {
            var s = h("easing." + e, function (t) {
                this._p1 = t || 0 === t ? t : 1.70158, this._p2 = 1.525 * this._p1
            }, !0), r = s.prototype = new t;
            return r.constructor = s, r.getRatio = i, r.config = function (t) {
                return new s(t)
            }, s
        }, f = u("Back", p("BackOut", function (t) {
            return (t -= 1) * t * ((this._p1 + 1) * t + this._p1) + 1
        }), p("BackIn", function (t) {
            return t * t * ((this._p1 + 1) * t - this._p1)
        }), p("BackInOut", function (t) {
            return 1 > (t *= 2) ? .5 * t * t * ((this._p2 + 1) * t - this._p2) : .5 * ((t -= 2) * t * ((this._p2 + 1) * t + this._p2) + 2)
        })), m = h("easing.SlowMo", function (t, e, i) {
            e = e || 0 === e ? e : .7, null == t ? t = .7 : t > 1 && (t = 1), this._p = 1 !== t ? e : 0, this._p1 = (1 - t) / 2, this._p2 = t, this._p3 = this._p1 + this._p2, this._calcEnd = i === !0
        }, !0), d = m.prototype = new t;
        return d.constructor = m, d.getRatio = function (t) {
            var e = t + (.5 - t) * this._p;
            return this._p1 > t ? this._calcEnd ? 1 - (t = 1 - t / this._p1) * t : e - (t = 1 - t / this._p1) * t * t * t * e : t > this._p3 ? this._calcEnd ? 1 - (t = (t - this._p3) / this._p1) * t : e + (t - e) * (t = (t - this._p3) / this._p1) * t * t * t : this._calcEnd ? 1 : e
        }, m.ease = new m(.7, .7), d.config = m.config = function (t, e, i) {
            return new m(t, e, i)
        }, e = h("easing.SteppedEase", function (t) {
            t = t || 1, this._p1 = 1 / t, this._p2 = t + 1
        }, !0), d = e.prototype = new t, d.constructor = e, d.getRatio = function (t) {
            return 0 > t ? t = 0 : t >= 1 && (t = .999999999), (this._p2 * t >> 0) * this._p1
        }, d.config = e.config = function (t) {
            return new e(t)
        }, i = h("easing.RoughEase", function (e) {
            e = e || {};
            for (var i, s, r, n, a, o, h = e.taper || "none", l = [], _ = 0, u = 0 | (e.points || 20), p = u, f = e.randomize !== !1, m = e.clamp === !0, d = e.template instanceof t ? e.template : null, g = "number" == typeof e.strength ? .4 * e.strength : .4; --p > -1;)i = f ? Math.random() : 1 / u * p, s = d ? d.getRatio(i) : i, "none" === h ? r = g : "out" === h ? (n = 1 - i, r = n * n * g) : "in" === h ? r = i * i * g : .5 > i ? (n = 2 * i, r = .5 * n * n * g) : (n = 2 * (1 - i), r = .5 * n * n * g), f ? s += Math.random() * r - .5 * r : p % 2 ? s += .5 * r : s -= .5 * r, m && (s > 1 ? s = 1 : 0 > s && (s = 0)), l[_++] = {
                x: i,
                y: s
            };
            for (l.sort(function (t, e) {
                return t.x - e.x
            }), o = new c(1, 1, null), p = u; --p > -1;)a = l[p], o = new c(a.x, a.y, o);
            this._prev = new c(0, 0, 0 !== o.t ? o : o.next)
        }, !0), d = i.prototype = new t, d.constructor = i, d.getRatio = function (t) {
            var e = this._prev;
            if (t > e.t) {
                for (; e.next && t >= e.t;)e = e.next;
                e = e.prev
            } else for (; e.prev && e.t >= t;)e = e.prev;
            return this._prev = e, e.v + (t - e.t) / e.gap * e.c
        }, d.config = function (t) {
            return new i(t)
        }, i.ease = new i, u("Bounce", l("BounceOut", function (t) {
            return 1 / 2.75 > t ? 7.5625 * t * t : 2 / 2.75 > t ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : 2.5 / 2.75 > t ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
        }), l("BounceIn", function (t) {
            return 1 / 2.75 > (t = 1 - t) ? 1 - 7.5625 * t * t : 2 / 2.75 > t ? 1 - (7.5625 * (t -= 1.5 / 2.75) * t + .75) : 2.5 / 2.75 > t ? 1 - (7.5625 * (t -= 2.25 / 2.75) * t + .9375) : 1 - (7.5625 * (t -= 2.625 / 2.75) * t + .984375)
        }), l("BounceInOut", function (t) {
            var e = .5 > t;
            return t = e ? 1 - 2 * t : 2 * t - 1, t = 1 / 2.75 > t ? 7.5625 * t * t : 2 / 2.75 > t ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : 2.5 / 2.75 > t ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375, e ? .5 * (1 - t) : .5 * t + .5
        })), u("Circ", l("CircOut", function (t) {
            return Math.sqrt(1 - (t -= 1) * t)
        }), l("CircIn", function (t) {
            return -(Math.sqrt(1 - t * t) - 1)
        }), l("CircInOut", function (t) {
            return 1 > (t *= 2) ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - (t -= 2) * t) + 1)
        })), s = function (e, i, s) {
            var r = h("easing." + e, function (t, e) {
                this._p1 = t || 1, this._p2 = e || s, this._p3 = this._p2 / a * (Math.asin(1 / this._p1) || 0)
            }, !0), n = r.prototype = new t;
            return n.constructor = r, n.getRatio = i, n.config = function (t, e) {
                return new r(t, e)
            }, r
        }, u("Elastic", s("ElasticOut", function (t) {
            return this._p1 * Math.pow(2, -10 * t) * Math.sin((t - this._p3) * a / this._p2) + 1
        }, .3), s("ElasticIn", function (t) {
            return -(this._p1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2))
        }, .3), s("ElasticInOut", function (t) {
            return 1 > (t *= 2) ? -.5 * this._p1 * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2) : .5 * this._p1 * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - this._p3) * a / this._p2) + 1
        }, .45)), u("Expo", l("ExpoOut", function (t) {
            return 1 - Math.pow(2, -10 * t)
        }), l("ExpoIn", function (t) {
            return Math.pow(2, 10 * (t - 1)) - .001
        }), l("ExpoInOut", function (t) {
            return 1 > (t *= 2) ? .5 * Math.pow(2, 10 * (t - 1)) : .5 * (2 - Math.pow(2, -10 * (t - 1)))
        })), u("Sine", l("SineOut", function (t) {
            return Math.sin(t * o)
        }), l("SineIn", function (t) {
            return -Math.cos(t * o) + 1
        }), l("SineInOut", function (t) {
            return -.5 * (Math.cos(Math.PI * t) - 1)
        })), h("easing.EaseLookup", {
            find: function (e) {
                return t.map[e]
            }
        }, !0), _(r.SlowMo, "SlowMo", "ease,"), _(i, "RoughEase", "ease,"), _(e, "SteppedEase", "ease,"), f
    }, !0)
}), _gsScope._gsDefine && _gsScope._gsQueue.pop()();
/*!
 * VERSION: 1.15.0
 * DATE: 2014-12-03
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 */
var _gsScope = "undefined" != typeof module && module.exports && "undefined" != typeof global ? global : this || window;
(_gsScope._gsQueue || (_gsScope._gsQueue = [])).push(function () {
    "use strict";
    _gsScope._gsDefine("plugins.CSSPlugin", ["plugins.TweenPlugin", "TweenLite"], function (t, e) {
        var i, r, s, n, a = function () {
            t.call(this, "css"), this._overwriteProps.length = 0, this.setRatio = a.prototype.setRatio
        }, o = _gsScope._gsDefine.globals, l = {}, h = a.prototype = new t("css");
        h.constructor = a, a.version = "1.15.0", a.API = 2, a.defaultTransformPerspective = 0, a.defaultSkewType = "compensated", h = "px", a.suffixMap = {
            top: h,
            right: h,
            bottom: h,
            left: h,
            width: h,
            height: h,
            fontSize: h,
            padding: h,
            margin: h,
            perspective: h,
            lineHeight: ""
        };
        var u, f, p, _, c, d, m = /(?:\d|\-\d|\.\d|\-\.\d)+/g, g = /(?:\d|\-\d|\.\d|\-\.\d|\+=\d|\-=\d|\+=.\d|\-=\.\d)+/g, v = /(?:\+=|\-=|\-|\b)[\d\-\.]+[a-zA-Z0-9]*(?:%|\b)/gi, y = /(?![+-]?\d*\.?\d+|[+-]|e[+-]\d+)[^0-9]/g, x = /(?:\d|\-|\+|=|#|\.)*/g, T = /opacity *= *([^)]*)/i, w = /opacity:([^;]*)/i, b = /alpha\(opacity *=.+?\)/i, P = /^(rgb|hsl)/, S = /([A-Z])/g, C = /-([a-z])/gi, R = /(^(?:url\(\"|url\())|(?:(\"\))$|\)$)/gi, k = function (t, e) {
            return e.toUpperCase()
        }, O = /(?:Left|Right|Width)/i, A = /(M11|M12|M21|M22)=[\d\-\.e]+/gi, D = /progid\:DXImageTransform\.Microsoft\.Matrix\(.+?\)/i, M = /,(?=[^\)]*(?:\(|$))/gi, L = Math.PI / 180, N = 180 / Math.PI, z = {}, X = document, I = function (t) {
            return X.createElementNS ? X.createElementNS("http://www.w3.org/1999/xhtml", t) : X.createElement(t)
        }, F = I("div"), E = I("img"), Y = a._internals = {_specialProps: l}, B = navigator.userAgent, U = function () {
            var t = B.indexOf("Android"), e = I("a");
            return p = -1 !== B.indexOf("Safari") && -1 === B.indexOf("Chrome") && (-1 === t || Number(B.substr(t + 8, 1)) > 3), c = p && 6 > Number(B.substr(B.indexOf("Version/") + 8, 1)), _ = -1 !== B.indexOf("Firefox"), (/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(B) || /Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(B)) && (d = parseFloat(RegExp.$1)), e ? (e.style.cssText = "top:1px;opacity:.55;", /^0.55/.test(e.style.opacity)) : !1
        }(), j = function (t) {
            return T.test("string" == typeof t ? t : (t.currentStyle ? t.currentStyle.filter : t.style.filter) || "") ? parseFloat(RegExp.$1) / 100 : 1
        }, W = function (t) {
            window.console && console.log(t)
        }, V = "", q = "", H = function (t, e) {
            e = e || F;
            var i, r, s = e.style;
            if (void 0 !== s[t])return t;
            for (t = t.charAt(0).toUpperCase() + t.substr(1), i = ["O", "Moz", "ms", "Ms", "Webkit"], r = 5; --r > -1 && void 0 === s[i[r] + t];);
            return r >= 0 ? (q = 3 === r ? "ms" : i[r], V = "-" + q.toLowerCase() + "-", q + t) : null
        }, Q = X.defaultView ? X.defaultView.getComputedStyle : function () {
        }, G = a.getStyle = function (t, e, i, r, s) {
            var n;
            return U || "opacity" !== e ? (!r && t.style[e] ? n = t.style[e] : (i = i || Q(t)) ? n = i[e] || i.getPropertyValue(e) || i.getPropertyValue(e.replace(S, "-$1").toLowerCase()) : t.currentStyle && (n = t.currentStyle[e]), null == s || n && "none" !== n && "auto" !== n && "auto auto" !== n ? n : s) : j(t)
        }, Z = Y.convertToPixels = function (t, i, r, s, n) {
            if ("px" === s || !s)return r;
            if ("auto" === s || !r)return 0;
            var o, l, h, u = O.test(i), f = t, p = F.style, _ = 0 > r;
            if (_ && (r = -r), "%" === s && -1 !== i.indexOf("border"))o = r / 100 * (u ? t.clientWidth : t.clientHeight); else {
                if (p.cssText = "border:0 solid red;position:" + G(t, "position") + ";line-height:0;", "%" !== s && f.appendChild)p[u ? "borderLeftWidth" : "borderTopWidth"] = r + s; else {
                    if (f = t.parentNode || X.body, l = f._gsCache, h = e.ticker.frame, l && u && l.time === h)return l.width * r / 100;
                    p[u ? "width" : "height"] = r + s
                }
                f.appendChild(F), o = parseFloat(F[u ? "offsetWidth" : "offsetHeight"]), f.removeChild(F), u && "%" === s && a.cacheWidths !== !1 && (l = f._gsCache = f._gsCache || {}, l.time = h, l.width = 100 * (o / r)), 0 !== o || n || (o = Z(t, i, r, s, !0))
            }
            return _ ? -o : o
        }, $ = Y.calculateOffset = function (t, e, i) {
            if ("absolute" !== G(t, "position", i))return 0;
            var r = "left" === e ? "Left" : "Top", s = G(t, "margin" + r, i);
            return t["offset" + r] - (Z(t, e, parseFloat(s), s.replace(x, "")) || 0)
        }, K = function (t, e) {
            var i, r, s = {};
            if (e = e || Q(t, null))if (i = e.length)for (; --i > -1;)s[e[i].replace(C, k)] = e.getPropertyValue(e[i]); else for (i in e)s[i] = e[i]; else if (e = t.currentStyle || t.style)for (i in e)"string" == typeof i && void 0 === s[i] && (s[i.replace(C, k)] = e[i]);
            return U || (s.opacity = j(t)), r = Me(t, e, !1), s.rotation = r.rotation, s.skewX = r.skewX, s.scaleX = r.scaleX, s.scaleY = r.scaleY, s.x = r.x, s.y = r.y, Se && (s.z = r.z, s.rotationX = r.rotationX, s.rotationY = r.rotationY, s.scaleZ = r.scaleZ), s.filters && delete s.filters, s
        }, J = function (t, e, i, r, s) {
            var n, a, o, l = {}, h = t.style;
            for (a in i)"cssText" !== a && "length" !== a && isNaN(a) && (e[a] !== (n = i[a]) || s && s[a]) && -1 === a.indexOf("Origin") && ("number" == typeof n || "string" == typeof n) && (l[a] = "auto" !== n || "left" !== a && "top" !== a ? "" !== n && "auto" !== n && "none" !== n || "string" != typeof e[a] || "" === e[a].replace(y, "") ? n : 0 : $(t, a), void 0 !== h[a] && (o = new _e(h, a, h[a], o)));
            if (r)for (a in r)"className" !== a && (l[a] = r[a]);
            return {difs: l, firstMPT: o}
        }, te = {
            width: ["Left", "Right"],
            height: ["Top", "Bottom"]
        }, ee = ["marginLeft", "marginRight", "marginTop", "marginBottom"], ie = function (t, e, i) {
            var r = parseFloat("width" === e ? t.offsetWidth : t.offsetHeight), s = te[e], n = s.length;
            for (i = i || Q(t, null); --n > -1;)r -= parseFloat(G(t, "padding" + s[n], i, !0)) || 0, r -= parseFloat(G(t, "border" + s[n] + "Width", i, !0)) || 0;
            return r
        }, re = function (t, e) {
            (null == t || "" === t || "auto" === t || "auto auto" === t) && (t = "0 0");
            var i = t.split(" "), r = -1 !== t.indexOf("left") ? "0%" : -1 !== t.indexOf("right") ? "100%" : i[0], s = -1 !== t.indexOf("top") ? "0%" : -1 !== t.indexOf("bottom") ? "100%" : i[1];
            return null == s ? s = "0" : "center" === s && (s = "50%"), ("center" === r || isNaN(parseFloat(r)) && -1 === (r + "").indexOf("=")) && (r = "50%"), e && (e.oxp = -1 !== r.indexOf("%"), e.oyp = -1 !== s.indexOf("%"), e.oxr = "=" === r.charAt(1), e.oyr = "=" === s.charAt(1), e.ox = parseFloat(r.replace(y, "")), e.oy = parseFloat(s.replace(y, ""))), r + " " + s + (i.length > 2 ? " " + i[2] : "")
        }, se = function (t, e) {
            return "string" == typeof t && "=" === t.charAt(1) ? parseInt(t.charAt(0) + "1", 10) * parseFloat(t.substr(2)) : parseFloat(t) - parseFloat(e)
        }, ne = function (t, e) {
            return null == t ? e : "string" == typeof t && "=" === t.charAt(1) ? parseInt(t.charAt(0) + "1", 10) * parseFloat(t.substr(2)) + e : parseFloat(t)
        }, ae = function (t, e, i, r) {
            var s, n, a, o, l = 1e-6;
            return null == t ? o = e : "number" == typeof t ? o = t : (s = 360, n = t.split("_"), a = Number(n[0].replace(y, "")) * (-1 === t.indexOf("rad") ? 1 : N) - ("=" === t.charAt(1) ? 0 : e), n.length && (r && (r[i] = e + a), -1 !== t.indexOf("short") && (a %= s, a !== a % (s / 2) && (a = 0 > a ? a + s : a - s)), -1 !== t.indexOf("_cw") && 0 > a ? a = (a + 9999999999 * s) % s - (0 | a / s) * s : -1 !== t.indexOf("ccw") && a > 0 && (a = (a - 9999999999 * s) % s - (0 | a / s) * s)), o = e + a), l > o && o > -l && (o = 0), o
        }, oe = {
            aqua: [0, 255, 255],
            lime: [0, 255, 0],
            silver: [192, 192, 192],
            black: [0, 0, 0],
            maroon: [128, 0, 0],
            teal: [0, 128, 128],
            blue: [0, 0, 255],
            navy: [0, 0, 128],
            white: [255, 255, 255],
            fuchsia: [255, 0, 255],
            olive: [128, 128, 0],
            yellow: [255, 255, 0],
            orange: [255, 165, 0],
            gray: [128, 128, 128],
            purple: [128, 0, 128],
            green: [0, 128, 0],
            red: [255, 0, 0],
            pink: [255, 192, 203],
            cyan: [0, 255, 255],
            transparent: [255, 255, 255, 0]
        }, le = function (t, e, i) {
            return t = 0 > t ? t + 1 : t > 1 ? t - 1 : t, 0 | 255 * (1 > 6 * t ? e + 6 * (i - e) * t : .5 > t ? i : 2 > 3 * t ? e + 6 * (i - e) * (2 / 3 - t) : e) + .5
        }, he = a.parseColor = function (t) {
            var e, i, r, s, n, a;
            return t && "" !== t ? "number" == typeof t ? [t >> 16, 255 & t >> 8, 255 & t] : ("," === t.charAt(t.length - 1) && (t = t.substr(0, t.length - 1)), oe[t] ? oe[t] : "#" === t.charAt(0) ? (4 === t.length && (e = t.charAt(1), i = t.charAt(2), r = t.charAt(3), t = "#" + e + e + i + i + r + r), t = parseInt(t.substr(1), 16), [t >> 16, 255 & t >> 8, 255 & t]) : "hsl" === t.substr(0, 3) ? (t = t.match(m), s = Number(t[0]) % 360 / 360, n = Number(t[1]) / 100, a = Number(t[2]) / 100, i = .5 >= a ? a * (n + 1) : a + n - a * n, e = 2 * a - i, t.length > 3 && (t[3] = Number(t[3])), t[0] = le(s + 1 / 3, e, i), t[1] = le(s, e, i), t[2] = le(s - 1 / 3, e, i), t) : (t = t.match(m) || oe.transparent, t[0] = Number(t[0]), t[1] = Number(t[1]), t[2] = Number(t[2]), t.length > 3 && (t[3] = Number(t[3])), t)) : oe.black
        }, ue = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#.+?\\b";
        for (h in oe)ue += "|" + h + "\\b";
        ue = RegExp(ue + ")", "gi");
        var fe = function (t, e, i, r) {
            if (null == t)return function (t) {
                return t
            };
            var s, n = e ? (t.match(ue) || [""])[0] : "", a = t.split(n).join("").match(v) || [], o = t.substr(0, t.indexOf(a[0])), l = ")" === t.charAt(t.length - 1) ? ")" : "", h = -1 !== t.indexOf(" ") ? " " : ",", u = a.length, f = u > 0 ? a[0].replace(m, "") : "";
            return u ? s = e ? function (t) {
                var e, p, _, c;
                if ("number" == typeof t)t += f; else if (r && M.test(t)) {
                    for (c = t.replace(M, "|").split("|"), _ = 0; c.length > _; _++)c[_] = s(c[_]);
                    return c.join(",")
                }
                if (e = (t.match(ue) || [n])[0], p = t.split(e).join("").match(v) || [], _ = p.length, u > _--)for (; u > ++_;)p[_] = i ? p[0 | (_ - 1) / 2] : a[_];
                return o + p.join(h) + h + e + l + (-1 !== t.indexOf("inset") ? " inset" : "")
            } : function (t) {
                var e, n, p;
                if ("number" == typeof t)t += f; else if (r && M.test(t)) {
                    for (n = t.replace(M, "|").split("|"), p = 0; n.length > p; p++)n[p] = s(n[p]);
                    return n.join(",")
                }
                if (e = t.match(v) || [], p = e.length, u > p--)for (; u > ++p;)e[p] = i ? e[0 | (p - 1) / 2] : a[p];
                return o + e.join(h) + l
            } : function (t) {
                return t
            }
        }, pe = function (t) {
            return t = t.split(","), function (e, i, r, s, n, a, o) {
                var l, h = (i + "").split(" ");
                for (o = {}, l = 0; 4 > l; l++)o[t[l]] = h[l] = h[l] || h[(l - 1) / 2 >> 0];
                return s.parse(e, o, n, a)
            }
        }, _e = (Y._setPluginRatio = function (t) {
            this.plugin.setRatio(t);
            for (var e, i, r, s, n = this.data, a = n.proxy, o = n.firstMPT, l = 1e-6; o;)e = a[o.v], o.r ? e = Math.round(e) : l > e && e > -l && (e = 0), o.t[o.p] = e, o = o._next;
            if (n.autoRotate && (n.autoRotate.rotation = a.rotation), 1 === t)for (o = n.firstMPT; o;) {
                if (i = o.t, i.type) {
                    if (1 === i.type) {
                        for (s = i.xs0 + i.s + i.xs1, r = 1; i.l > r; r++)s += i["xn" + r] + i["xs" + (r + 1)];
                        i.e = s
                    }
                } else i.e = i.s + i.xs0;
                o = o._next
            }
        }, function (t, e, i, r, s) {
            this.t = t, this.p = e, this.v = i, this.r = s, r && (r._prev = this, this._next = r)
        }), ce = (Y._parseToProxy = function (t, e, i, r, s, n) {
            var a, o, l, h, u, f = r, p = {}, _ = {}, c = i._transform, d = z;
            for (i._transform = null, z = e, r = u = i.parse(t, e, r, s), z = d, n && (i._transform = c, f && (f._prev = null, f._prev && (f._prev._next = null))); r && r !== f;) {
                if (1 >= r.type && (o = r.p, _[o] = r.s + r.c, p[o] = r.s, n || (h = new _e(r, "s", o, h, r.r), r.c = 0), 1 === r.type))for (a = r.l; --a > 0;)l = "xn" + a, o = r.p + "_" + l, _[o] = r.data[l], p[o] = r[l], n || (h = new _e(r, l, o, h, r.rxp[l]));
                r = r._next
            }
            return {proxy: p, end: _, firstMPT: h, pt: u}
        }, Y.CSSPropTween = function (t, e, r, s, a, o, l, h, u, f, p) {
            this.t = t, this.p = e, this.s = r, this.c = s, this.n = l || e, t instanceof ce || n.push(this.n), this.r = h, this.type = o || 0, u && (this.pr = u, i = !0), this.b = void 0 === f ? r : f, this.e = void 0 === p ? r + s : p, a && (this._next = a, a._prev = this)
        }), de = a.parseComplex = function (t, e, i, r, s, n, a, o, l, h) {
            i = i || n || "", a = new ce(t, e, 0, 0, a, h ? 2 : 1, null, !1, o, i, r), r += "";
            var f, p, _, c, d, v, y, x, T, w, b, S, C = i.split(", ").join(",").split(" "), R = r.split(", ").join(",").split(" "), k = C.length, O = u !== !1;
            for ((-1 !== r.indexOf(",") || -1 !== i.indexOf(",")) && (C = C.join(" ").replace(M, ", ").split(" "), R = R.join(" ").replace(M, ", ").split(" "), k = C.length), k !== R.length && (C = (n || "").split(" "), k = C.length), a.plugin = l, a.setRatio = h, f = 0; k > f; f++)if (c = C[f], d = R[f], x = parseFloat(c), x || 0 === x)a.appendXtra("", x, se(d, x), d.replace(g, ""), O && -1 !== d.indexOf("px"), !0); else if (s && ("#" === c.charAt(0) || oe[c] || P.test(c)))S = "," === d.charAt(d.length - 1) ? ")," : ")", c = he(c), d = he(d), T = c.length + d.length > 6, T && !U && 0 === d[3] ? (a["xs" + a.l] += a.l ? " transparent" : "transparent", a.e = a.e.split(R[f]).join("transparent")) : (U || (T = !1), a.appendXtra(T ? "rgba(" : "rgb(", c[0], d[0] - c[0], ",", !0, !0).appendXtra("", c[1], d[1] - c[1], ",", !0).appendXtra("", c[2], d[2] - c[2], T ? "," : S, !0), T && (c = 4 > c.length ? 1 : c[3], a.appendXtra("", c, (4 > d.length ? 1 : d[3]) - c, S, !1))); else if (v = c.match(m)) {
                if (y = d.match(g), !y || y.length !== v.length)return a;
                for (_ = 0, p = 0; v.length > p; p++)b = v[p], w = c.indexOf(b, _), a.appendXtra(c.substr(_, w - _), Number(b), se(y[p], b), "", O && "px" === c.substr(w + b.length, 2), 0 === p), _ = w + b.length;
                a["xs" + a.l] += c.substr(_)
            } else a["xs" + a.l] += a.l ? " " + c : c;
            if (-1 !== r.indexOf("=") && a.data) {
                for (S = a.xs0 + a.data.s, f = 1; a.l > f; f++)S += a["xs" + f] + a.data["xn" + f];
                a.e = S + a["xs" + f]
            }
            return a.l || (a.type = -1, a.xs0 = a.e), a.xfirst || a
        }, me = 9;
        for (h = ce.prototype, h.l = h.pr = 0; --me > 0;)h["xn" + me] = 0, h["xs" + me] = "";
        h.xs0 = "", h._next = h._prev = h.xfirst = h.data = h.plugin = h.setRatio = h.rxp = null, h.appendXtra = function (t, e, i, r, s, n) {
            var a = this, o = a.l;
            return a["xs" + o] += n && o ? " " + t : t || "", i || 0 === o || a.plugin ? (a.l++, a.type = a.setRatio ? 2 : 1, a["xs" + a.l] = r || "", o > 0 ? (a.data["xn" + o] = e + i, a.rxp["xn" + o] = s, a["xn" + o] = e, a.plugin || (a.xfirst = new ce(a, "xn" + o, e, i, a.xfirst || a, 0, a.n, s, a.pr), a.xfirst.xs0 = 0), a) : (a.data = {s: e + i}, a.rxp = {}, a.s = e, a.c = i, a.r = s, a)) : (a["xs" + o] += e + (r || ""), a)
        };
        var ge = function (t, e) {
            e = e || {}, this.p = e.prefix ? H(t) || t : t, l[t] = l[this.p] = this, this.format = e.formatter || fe(e.defaultValue, e.color, e.collapsible, e.multi), e.parser && (this.parse = e.parser), this.clrs = e.color, this.multi = e.multi, this.keyword = e.keyword, this.dflt = e.defaultValue, this.pr = e.priority || 0
        }, ve = Y._registerComplexSpecialProp = function (t, e, i) {
            "object" != typeof e && (e = {parser: i});
            var r, s, n = t.split(","), a = e.defaultValue;
            for (i = i || [a], r = 0; n.length > r; r++)e.prefix = 0 === r && e.prefix, e.defaultValue = i[r] || a, s = new ge(n[r], e)
        }, ye = function (t) {
            if (!l[t]) {
                var e = t.charAt(0).toUpperCase() + t.substr(1) + "Plugin";
                ve(t, {
                    parser: function (t, i, r, s, n, a, h) {
                        var u = o.com.greensock.plugins[e];
                        return u ? (u._cssRegister(), l[r].parse(t, i, r, s, n, a, h)) : (W("Error: " + e + " js file not loaded."), n)
                    }
                })
            }
        };
        h = ge.prototype, h.parseComplex = function (t, e, i, r, s, n) {
            var a, o, l, h, u, f, p = this.keyword;
            if (this.multi && (M.test(i) || M.test(e) ? (o = e.replace(M, "|").split("|"), l = i.replace(M, "|").split("|")) : p && (o = [e], l = [i])), l) {
                for (h = l.length > o.length ? l.length : o.length, a = 0; h > a; a++)e = o[a] = o[a] || this.dflt, i = l[a] = l[a] || this.dflt, p && (u = e.indexOf(p), f = i.indexOf(p), u !== f && (i = -1 === f ? l : o, i[a] += " " + p));
                e = o.join(", "), i = l.join(", ")
            }
            return de(t, this.p, e, i, this.clrs, this.dflt, r, this.pr, s, n)
        }, h.parse = function (t, e, i, r, n, a) {
            return this.parseComplex(t.style, this.format(G(t, this.p, s, !1, this.dflt)), this.format(e), n, a)
        }, a.registerSpecialProp = function (t, e, i) {
            ve(t, {
                parser: function (t, r, s, n, a, o) {
                    var l = new ce(t, s, 0, 0, a, 2, s, !1, i);
                    return l.plugin = o, l.setRatio = e(t, r, n._tween, s), l
                }, priority: i
            })
        };
        var xe, Te = "scaleX,scaleY,scaleZ,x,y,z,skewX,skewY,rotation,rotationX,rotationY,perspective,xPercent,yPercent".split(","), we = H("transform"), be = V + "transform", Pe = H("transformOrigin"), Se = null !== H("perspective"), Ce = Y.Transform = function () {
            this.perspective = parseFloat(a.defaultTransformPerspective) || 0, this.force3D = a.defaultForce3D !== !1 && Se ? a.defaultForce3D || "auto" : !1
        }, Re = window.SVGElement, ke = function (t, e, i) {
            var r, s = X.createElementNS("http://www.w3.org/2000/svg", t), n = /([a-z])([A-Z])/g;
            for (r in i)s.setAttributeNS(null, r.replace(n, "$1-$2").toLowerCase(), i[r]);
            return e.appendChild(s), s
        }, Oe = document.documentElement, Ae = function () {
            var t, e, i, r = d || /Android/i.test(B) && !window.chrome;
            return X.createElementNS && !r && (t = ke("svg", Oe), e = ke("rect", t, {
                width: 100,
                height: 50,
                x: 100
            }), i = e.getBoundingClientRect().width, e.style[Pe] = "50% 50%", e.style[we] = "scaleX(0.5)", r = i === e.getBoundingClientRect().width, Oe.removeChild(t)), r
        }(), De = function (t, e, i) {
            var r = t.getBBox();
            e = re(e).split(" "), i.xOrigin = (-1 !== e[0].indexOf("%") ? parseFloat(e[0]) / 100 * r.width : parseFloat(e[0])) + r.x, i.yOrigin = (-1 !== e[1].indexOf("%") ? parseFloat(e[1]) / 100 * r.height : parseFloat(e[1])) + r.y
        }, Me = Y.getTransform = function (t, e, i, r) {
            if (t._gsTransform && i && !r)return t._gsTransform;
            var n, o, l, h, u, f, p, _, c, d, m = i ? t._gsTransform || new Ce : new Ce, g = 0 > m.scaleX, v = 2e-5, y = 1e5, x = Se ? parseFloat(G(t, Pe, e, !1, "0 0 0").split(" ")[2]) || m.zOrigin || 0 : 0, T = parseFloat(a.defaultTransformPerspective) || 0;
            if (we ? o = G(t, be, e, !0) : t.currentStyle && (o = t.currentStyle.filter.match(A), o = o && 4 === o.length ? [o[0].substr(4), Number(o[2].substr(4)), Number(o[1].substr(4)), o[3].substr(4), m.x || 0, m.y || 0].join(",") : ""), n = !o || "none" === o || "matrix(1, 0, 0, 1, 0, 0)" === o, m.svg = !!(Re && "function" == typeof t.getBBox && t.getCTM && (!t.parentNode || t.parentNode.getBBox && t.parentNode.getCTM)), m.svg && (De(t, G(t, Pe, s, !1, "50% 50%") + "", m), xe = a.useSVGTransformAttr || Ae, l = t.getAttribute("transform"), n && l && -1 !== l.indexOf("matrix") && (o = l, n = 0)), !n) {
                for (l = (o || "").match(/(?:\-|\b)[\d\-\.e]+\b/gi) || [], h = l.length; --h > -1;)u = Number(l[h]), l[h] = (f = u - (u |= 0)) ? (0 | f * y + (0 > f ? -.5 : .5)) / y + u : u;
                if (16 === l.length) {
                    var w = l[8], b = l[9], P = l[10], S = l[12], C = l[13], R = l[14];
                    m.zOrigin && (R = -m.zOrigin, S = w * R - l[12], C = b * R - l[13], R = P * R + m.zOrigin - l[14]);
                    var k, O, D, M, L, z = l[0], X = l[1], I = l[2], F = l[3], E = l[4], Y = l[5], B = l[6], U = l[7], j = l[11], W = Math.atan2(X, Y);
                    m.rotation = W * N, W && (M = Math.cos(-W), L = Math.sin(-W), z = z * M + E * L, O = X * M + Y * L, Y = X * -L + Y * M, B = I * -L + B * M, X = O), W = Math.atan2(w, z), m.rotationY = W * N, W && (M = Math.cos(-W), L = Math.sin(-W), k = z * M - w * L, O = X * M - b * L, D = I * M - P * L, b = X * L + b * M, P = I * L + P * M, j = F * L + j * M, z = k, X = O, I = D), W = Math.atan2(B, P), m.rotationX = W * N, W && (M = Math.cos(-W), L = Math.sin(-W), k = E * M + w * L, O = Y * M + b * L, D = B * M + P * L, w = E * -L + w * M, b = Y * -L + b * M, P = B * -L + P * M, j = U * -L + j * M, E = k, Y = O, B = D), m.scaleX = (0 | Math.sqrt(z * z + X * X) * y + .5) / y, m.scaleY = (0 | Math.sqrt(Y * Y + b * b) * y + .5) / y, m.scaleZ = (0 | Math.sqrt(B * B + P * P) * y + .5) / y, m.skewX = 0, m.perspective = j ? 1 / (0 > j ? -j : j) : 0, m.x = S, m.y = C, m.z = R
                } else if (!(Se && !r && l.length && m.x === l[4] && m.y === l[5] && (m.rotationX || m.rotationY) || void 0 !== m.x && "none" === G(t, "display", e))) {
                    var V = l.length >= 6, q = V ? l[0] : 1, H = l[1] || 0, Q = l[2] || 0, Z = V ? l[3] : 1;
                    m.x = l[4] || 0, m.y = l[5] || 0, p = Math.sqrt(q * q + H * H), _ = Math.sqrt(Z * Z + Q * Q), c = q || H ? Math.atan2(H, q) * N : m.rotation || 0, d = Q || Z ? Math.atan2(Q, Z) * N + c : m.skewX || 0, Math.abs(d) > 90 && 270 > Math.abs(d) && (g ? (p *= -1, d += 0 >= c ? 180 : -180, c += 0 >= c ? 180 : -180) : (_ *= -1, d += 0 >= d ? 180 : -180)), m.scaleX = p, m.scaleY = _, m.rotation = c, m.skewX = d, Se && (m.rotationX = m.rotationY = m.z = 0, m.perspective = T, m.scaleZ = 1)
                }
                m.zOrigin = x;
                for (h in m)v > m[h] && m[h] > -v && (m[h] = 0)
            }
            return i && (t._gsTransform = m), m
        }, Le = function (t) {
            var e, i, r = this.data, s = -r.rotation * L, n = s + r.skewX * L, a = 1e5, o = (0 | Math.cos(s) * r.scaleX * a) / a, l = (0 | Math.sin(s) * r.scaleX * a) / a, h = (0 | Math.sin(n) * -r.scaleY * a) / a, u = (0 | Math.cos(n) * r.scaleY * a) / a, f = this.t.style, p = this.t.currentStyle;
            if (p) {
                i = l, l = -h, h = -i, e = p.filter, f.filter = "";
                var _, c, m = this.t.offsetWidth, g = this.t.offsetHeight, v = "absolute" !== p.position, y = "progid:DXImageTransform.Microsoft.Matrix(M11=" + o + ", M12=" + l + ", M21=" + h + ", M22=" + u, w = r.x + m * r.xPercent / 100, b = r.y + g * r.yPercent / 100;
                if (null != r.ox && (_ = (r.oxp ? .01 * m * r.ox : r.ox) - m / 2, c = (r.oyp ? .01 * g * r.oy : r.oy) - g / 2, w += _ - (_ * o + c * l), b += c - (_ * h + c * u)), v ? (_ = m / 2, c = g / 2, y += ", Dx=" + (_ - (_ * o + c * l) + w) + ", Dy=" + (c - (_ * h + c * u) + b) + ")") : y += ", sizingMethod='auto expand')", f.filter = -1 !== e.indexOf("DXImageTransform.Microsoft.Matrix(") ? e.replace(D, y) : y + " " + e, (0 === t || 1 === t) && 1 === o && 0 === l && 0 === h && 1 === u && (v && -1 === y.indexOf("Dx=0, Dy=0") || T.test(e) && 100 !== parseFloat(RegExp.$1) || -1 === e.indexOf("gradient(" && e.indexOf("Alpha")) && f.removeAttribute("filter")), !v) {
                    var P, S, C, R = 8 > d ? 1 : -1;
                    for (_ = r.ieOffsetX || 0, c = r.ieOffsetY || 0, r.ieOffsetX = Math.round((m - ((0 > o ? -o : o) * m + (0 > l ? -l : l) * g)) / 2 + w), r.ieOffsetY = Math.round((g - ((0 > u ? -u : u) * g + (0 > h ? -h : h) * m)) / 2 + b), me = 0; 4 > me; me++)S = ee[me], P = p[S], i = -1 !== P.indexOf("px") ? parseFloat(P) : Z(this.t, S, parseFloat(P), P.replace(x, "")) || 0, C = i !== r[S] ? 2 > me ? -r.ieOffsetX : -r.ieOffsetY : 2 > me ? _ - r.ieOffsetX : c - r.ieOffsetY, f[S] = (r[S] = Math.round(i - C * (0 === me || 2 === me ? 1 : R))) + "px"
                }
            }
        }, Ne = Y.set3DTransformRatio = function (t) {
            var e, i, r, s, n, a, o, l, h, u, f, p, c, d, m, g, v, y, x, T, w, b, P, S, C, R = this.data, k = this.t.style, O = R.rotation * L, A = R.scaleX, D = R.scaleY, M = R.scaleZ, N = R.x, z = R.y, X = R.z, I = R.perspective;
            if (!(1 !== t && 0 !== t || "auto" !== R.force3D || R.rotationY || R.rotationX || 1 !== M || I || X))return ze.call(this, t), void 0;
            if (_) {
                var F = 1e-4;
                F > A && A > -F && (A = M = 2e-5), F > D && D > -F && (D = M = 2e-5), !I || R.z || R.rotationX || R.rotationY || (I = 0)
            }
            if (O || R.skewX)y = Math.cos(O), x = Math.sin(O), e = y, n = x, R.skewX && (O -= R.skewX * L, y = Math.cos(O), x = Math.sin(O), "simple" === R.skewType && (T = Math.tan(R.skewX * L), T = Math.sqrt(1 + T * T), y *= T, x *= T)), i = -x, a = y; else {
                if (!(R.rotationY || R.rotationX || 1 !== M || I || R.svg))return k[we] = (R.xPercent || R.yPercent ? "translate(" + R.xPercent + "%," + R.yPercent + "%) translate3d(" : "translate3d(") + N + "px," + z + "px," + X + "px)" + (1 !== A || 1 !== D ? " scale(" + A + "," + D + ")" : ""), void 0;
                e = a = 1, i = n = 0
            }
            f = 1, r = s = o = l = h = u = p = c = d = 0, m = I ? -1 / I : 0, g = R.zOrigin, v = 1e5, C = ",", O = R.rotationY * L, O && (y = Math.cos(O), x = Math.sin(O), h = f * -x, c = m * -x, r = e * x, o = n * x, f *= y, m *= y, e *= y, n *= y), O = R.rotationX * L, O && (y = Math.cos(O), x = Math.sin(O), T = i * y + r * x, w = a * y + o * x, b = u * y + f * x, P = d * y + m * x, r = i * -x + r * y, o = a * -x + o * y, f = u * -x + f * y, m = d * -x + m * y, i = T, a = w, u = b, d = P), 1 !== M && (r *= M, o *= M, f *= M, m *= M), 1 !== D && (i *= D, a *= D, u *= D, d *= D), 1 !== A && (e *= A, n *= A, h *= A, c *= A), g && (p -= g, s = r * p, l = o * p, p = f * p + g), R.svg && (s += R.xOrigin - (R.xOrigin * e + R.yOrigin * i), l += R.yOrigin - (R.xOrigin * n + R.yOrigin * a)), s = (T = (s += N) - (s |= 0)) ? (0 | T * v + (0 > T ? -.5 : .5)) / v + s : s, l = (T = (l += z) - (l |= 0)) ? (0 | T * v + (0 > T ? -.5 : .5)) / v + l : l, p = (T = (p += X) - (p |= 0)) ? (0 | T * v + (0 > T ? -.5 : .5)) / v + p : p, S = R.xPercent || R.yPercent ? "translate(" + R.xPercent + "%," + R.yPercent + "%) matrix3d(" : "matrix3d(", S += (0 | e * v) / v + C + (0 | n * v) / v + C + (0 | h * v) / v, S += C + (0 | c * v) / v + C + (0 | i * v) / v + C + (0 | a * v) / v, S += C + (0 | u * v) / v + C + (0 | d * v) / v + C + (0 | r * v) / v, S += C + (0 | o * v) / v + C + (0 | f * v) / v + C + (0 | m * v) / v, S += C + s + C + l + C + p + C + (I ? 1 + -p / I : 1) + ")", k[we] = S
        }, ze = Y.set2DTransformRatio = function (t) {
            var e, i, r, s, n, a, o, l, h, u, f, p = this.data, _ = this.t, c = _.style, d = p.x, m = p.y;
            return !(p.rotationX || p.rotationY || p.z || p.force3D === !0 || "auto" === p.force3D && 1 !== t && 0 !== t) || p.svg && xe || !Se ? (s = p.scaleX, n = p.scaleY, p.rotation || p.skewX || p.svg ? (e = p.rotation * L, i = e - p.skewX * L, r = 1e5, a = Math.cos(e) * s, o = Math.sin(e) * s, l = Math.sin(i) * -n, h = Math.cos(i) * n, p.svg && (d += p.xOrigin - (p.xOrigin * a + p.yOrigin * l), m += p.yOrigin - (p.xOrigin * o + p.yOrigin * h), f = 1e-6, f > d && d > -f && (d = 0), f > m && m > -f && (m = 0)), u = (0 | a * r) / r + "," + (0 | o * r) / r + "," + (0 | l * r) / r + "," + (0 | h * r) / r + "," + d + "," + m + ")", p.svg && xe ? _.setAttribute("transform", "matrix(" + u) : c[we] = (p.xPercent || p.yPercent ? "translate(" + p.xPercent + "%," + p.yPercent + "%) matrix(" : "matrix(") + u) : c[we] = (p.xPercent || p.yPercent ? "translate(" + p.xPercent + "%," + p.yPercent + "%) matrix(" : "matrix(") + s + ",0,0," + n + "," + d + "," + m + ")", void 0) : (this.setRatio = Ne, Ne.call(this, t), void 0)
        };
        h = Ce.prototype, h.x = h.y = h.z = h.skewX = h.skewY = h.rotation = h.rotationX = h.rotationY = h.zOrigin = h.xPercent = h.yPercent = 0, h.scaleX = h.scaleY = h.scaleZ = 1, ve("transform,scale,scaleX,scaleY,scaleZ,x,y,z,rotation,rotationX,rotationY,rotationZ,skewX,skewY,shortRotation,shortRotationX,shortRotationY,shortRotationZ,transformOrigin,transformPerspective,directionalRotation,parseTransform,force3D,skewType,xPercent,yPercent", {
            parser: function (t, e, i, r, n, o, l) {
                if (r._lastParsedTransform === l)return n;
                r._lastParsedTransform = l;
                var h, u, f, p, _, c, d, m = r._transform = Me(t, s, !0, l.parseTransform), g = t.style, v = 1e-6, y = Te.length, x = l, T = {};
                if ("string" == typeof x.transform && we)f = F.style, f[we] = x.transform, f.display = "block", f.position = "absolute", X.body.appendChild(F), h = Me(F, null, !1), X.body.removeChild(F); else if ("object" == typeof x) {
                    if (h = {
                            scaleX: ne(null != x.scaleX ? x.scaleX : x.scale, m.scaleX),
                            scaleY: ne(null != x.scaleY ? x.scaleY : x.scale, m.scaleY),
                            scaleZ: ne(x.scaleZ, m.scaleZ),
                            x: ne(x.x, m.x),
                            y: ne(x.y, m.y),
                            z: ne(x.z, m.z),
                            xPercent: ne(x.xPercent, m.xPercent),
                            yPercent: ne(x.yPercent, m.yPercent),
                            perspective: ne(x.transformPerspective, m.perspective)
                        }, d = x.directionalRotation, null != d)if ("object" == typeof d)for (f in d)x[f] = d[f]; else x.rotation = d;
                    "string" == typeof x.x && -1 !== x.x.indexOf("%") && (h.x = 0, h.xPercent = ne(x.x, m.xPercent)), "string" == typeof x.y && -1 !== x.y.indexOf("%") && (h.y = 0, h.yPercent = ne(x.y, m.yPercent)), h.rotation = ae("rotation"in x ? x.rotation : "shortRotation"in x ? x.shortRotation + "_short" : "rotationZ"in x ? x.rotationZ : m.rotation, m.rotation, "rotation", T), Se && (h.rotationX = ae("rotationX"in x ? x.rotationX : "shortRotationX"in x ? x.shortRotationX + "_short" : m.rotationX || 0, m.rotationX, "rotationX", T), h.rotationY = ae("rotationY"in x ? x.rotationY : "shortRotationY"in x ? x.shortRotationY + "_short" : m.rotationY || 0, m.rotationY, "rotationY", T)), h.skewX = null == x.skewX ? m.skewX : ae(x.skewX, m.skewX), h.skewY = null == x.skewY ? m.skewY : ae(x.skewY, m.skewY), (u = h.skewY - m.skewY) && (h.skewX += u, h.rotation += u)
                }
                for (Se && null != x.force3D && (m.force3D = x.force3D, c = !0), m.skewType = x.skewType || m.skewType || a.defaultSkewType, _ = m.force3D || m.z || m.rotationX || m.rotationY || h.z || h.rotationX || h.rotationY || h.perspective, _ || null == x.scale || (h.scaleZ = 1); --y > -1;)i = Te[y], p = h[i] - m[i], (p > v || -v > p || null != x[i] || null != z[i]) && (c = !0, n = new ce(m, i, m[i], p, n), i in T && (n.e = T[i]), n.xs0 = 0, n.plugin = o, r._overwriteProps.push(n.n));
                return p = x.transformOrigin, p && m.svg && (De(t, p, h), n = new ce(m, "xOrigin", m.xOrigin, h.xOrigin - m.xOrigin, n, -1, "transformOrigin"), n.b = m.xOrigin, n.e = n.xs0 = h.xOrigin, n = new ce(m, "yOrigin", m.yOrigin, h.yOrigin - m.yOrigin, n, -1, "transformOrigin"), n.b = m.yOrigin, n.e = n.xs0 = h.yOrigin, p = "0px 0px"), (p || Se && _ && m.zOrigin) && (we ? (c = !0, i = Pe, p = (p || G(t, i, s, !1, "50% 50%")) + "", n = new ce(g, i, 0, 0, n, -1, "transformOrigin"), n.b = g[i], n.plugin = o, Se ? (f = m.zOrigin, p = p.split(" "), m.zOrigin = (p.length > 2 && (0 === f || "0px" !== p[2]) ? parseFloat(p[2]) : f) || 0, n.xs0 = n.e = p[0] + " " + (p[1] || "50%") + " 0px", n = new ce(m, "zOrigin", 0, 0, n, -1, n.n), n.b = f, n.xs0 = n.e = m.zOrigin) : n.xs0 = n.e = p) : re(p + "", m)), c && (r._transformType = m.svg && xe || !_ && 3 !== this._transformType ? 2 : 3), n
            }, prefix: !0
        }), ve("boxShadow", {
            defaultValue: "0px 0px 0px 0px #999",
            prefix: !0,
            color: !0,
            multi: !0,
            keyword: "inset"
        }), ve("borderRadius", {
            defaultValue: "0px", parser: function (t, e, i, n, a) {
                e = this.format(e);
                var o, l, h, u, f, p, _, c, d, m, g, v, y, x, T, w, b = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"], P = t.style;
                for (d = parseFloat(t.offsetWidth), m = parseFloat(t.offsetHeight), o = e.split(" "), l = 0; b.length > l; l++)this.p.indexOf("border") && (b[l] = H(b[l])), f = u = G(t, b[l], s, !1, "0px"), -1 !== f.indexOf(" ") && (u = f.split(" "), f = u[0], u = u[1]), p = h = o[l], _ = parseFloat(f), v = f.substr((_ + "").length), y = "=" === p.charAt(1), y ? (c = parseInt(p.charAt(0) + "1", 10), p = p.substr(2), c *= parseFloat(p), g = p.substr((c + "").length - (0 > c ? 1 : 0)) || "") : (c = parseFloat(p), g = p.substr((c + "").length)), "" === g && (g = r[i] || v), g !== v && (x = Z(t, "borderLeft", _, v), T = Z(t, "borderTop", _, v), "%" === g ? (f = 100 * (x / d) + "%", u = 100 * (T / m) + "%") : "em" === g ? (w = Z(t, "borderLeft", 1, "em"), f = x / w + "em", u = T / w + "em") : (f = x + "px", u = T + "px"), y && (p = parseFloat(f) + c + g, h = parseFloat(u) + c + g)), a = de(P, b[l], f + " " + u, p + " " + h, !1, "0px", a);
                return a
            }, prefix: !0, formatter: fe("0px 0px 0px 0px", !1, !0)
        }), ve("backgroundPosition", {
            defaultValue: "0 0", parser: function (t, e, i, r, n, a) {
                var o, l, h, u, f, p, _ = "background-position", c = s || Q(t, null), m = this.format((c ? d ? c.getPropertyValue(_ + "-x") + " " + c.getPropertyValue(_ + "-y") : c.getPropertyValue(_) : t.currentStyle.backgroundPositionX + " " + t.currentStyle.backgroundPositionY) || "0 0"), g = this.format(e);
                if (-1 !== m.indexOf("%") != (-1 !== g.indexOf("%")) && (p = G(t, "backgroundImage").replace(R, ""), p && "none" !== p)) {
                    for (o = m.split(" "), l = g.split(" "), E.setAttribute("src", p), h = 2; --h > -1;)m = o[h], u = -1 !== m.indexOf("%"), u !== (-1 !== l[h].indexOf("%")) && (f = 0 === h ? t.offsetWidth - E.width : t.offsetHeight - E.height, o[h] = u ? parseFloat(m) / 100 * f + "px" : 100 * (parseFloat(m) / f) + "%");
                    m = o.join(" ")
                }
                return this.parseComplex(t.style, m, g, n, a)
            }, formatter: re
        }), ve("backgroundSize", {defaultValue: "0 0", formatter: re}), ve("perspective", {
            defaultValue: "0px",
            prefix: !0
        }), ve("perspectiveOrigin", {
            defaultValue: "50% 50%",
            prefix: !0
        }), ve("transformStyle", {prefix: !0}), ve("backfaceVisibility", {prefix: !0}), ve("userSelect", {prefix: !0}), ve("margin", {parser: pe("marginTop,marginRight,marginBottom,marginLeft")}), ve("padding", {parser: pe("paddingTop,paddingRight,paddingBottom,paddingLeft")}), ve("clip", {
            defaultValue: "rect(0px,0px,0px,0px)",
            parser: function (t, e, i, r, n, a) {
                var o, l, h;
                return 9 > d ? (l = t.currentStyle, h = 8 > d ? " " : ",", o = "rect(" + l.clipTop + h + l.clipRight + h + l.clipBottom + h + l.clipLeft + ")", e = this.format(e).split(",").join(h)) : (o = this.format(G(t, this.p, s, !1, this.dflt)), e = this.format(e)), this.parseComplex(t.style, o, e, n, a)
            }
        }), ve("textShadow", {
            defaultValue: "0px 0px 0px #999",
            color: !0,
            multi: !0
        }), ve("autoRound,strictUnits", {
            parser: function (t, e, i, r, s) {
                return s
            }
        }), ve("border", {
            defaultValue: "0px solid #000", parser: function (t, e, i, r, n, a) {
                return this.parseComplex(t.style, this.format(G(t, "borderTopWidth", s, !1, "0px") + " " + G(t, "borderTopStyle", s, !1, "solid") + " " + G(t, "borderTopColor", s, !1, "#000")), this.format(e), n, a)
            }, color: !0, formatter: function (t) {
                var e = t.split(" ");
                return e[0] + " " + (e[1] || "solid") + " " + (t.match(ue) || ["#000"])[0]
            }
        }), ve("borderWidth", {parser: pe("borderTopWidth,borderRightWidth,borderBottomWidth,borderLeftWidth")}), ve("float,cssFloat,styleFloat", {
            parser: function (t, e, i, r, s) {
                var n = t.style, a = "cssFloat"in n ? "cssFloat" : "styleFloat";
                return new ce(n, a, 0, 0, s, -1, i, !1, 0, n[a], e)
            }
        });
        var Xe = function (t) {
            var e, i = this.t, r = i.filter || G(this.data, "filter") || "", s = 0 | this.s + this.c * t;
            100 === s && (-1 === r.indexOf("atrix(") && -1 === r.indexOf("radient(") && -1 === r.indexOf("oader(") ? (i.removeAttribute("filter"), e = !G(this.data, "filter")) : (i.filter = r.replace(b, ""), e = !0)), e || (this.xn1 && (i.filter = r = r || "alpha(opacity=" + s + ")"), -1 === r.indexOf("pacity") ? 0 === s && this.xn1 || (i.filter = r + " alpha(opacity=" + s + ")") : i.filter = r.replace(T, "opacity=" + s))
        };
        ve("opacity,alpha,autoAlpha", {
            defaultValue: "1", parser: function (t, e, i, r, n, a) {
                var o = parseFloat(G(t, "opacity", s, !1, "1")), l = t.style, h = "autoAlpha" === i;
                return "string" == typeof e && "=" === e.charAt(1) && (e = ("-" === e.charAt(0) ? -1 : 1) * parseFloat(e.substr(2)) + o), h && 1 === o && "hidden" === G(t, "visibility", s) && 0 !== e && (o = 0), U ? n = new ce(l, "opacity", o, e - o, n) : (n = new ce(l, "opacity", 100 * o, 100 * (e - o), n), n.xn1 = h ? 1 : 0, l.zoom = 1, n.type = 2, n.b = "alpha(opacity=" + n.s + ")", n.e = "alpha(opacity=" + (n.s + n.c) + ")", n.data = t, n.plugin = a, n.setRatio = Xe), h && (n = new ce(l, "visibility", 0, 0, n, -1, null, !1, 0, 0 !== o ? "inherit" : "hidden", 0 === e ? "hidden" : "inherit"), n.xs0 = "inherit", r._overwriteProps.push(n.n), r._overwriteProps.push(i)), n
            }
        });
        var Ie = function (t, e) {
            e && (t.removeProperty ? ("ms" === e.substr(0, 2) && (e = "M" + e.substr(1)), t.removeProperty(e.replace(S, "-$1").toLowerCase())) : t.removeAttribute(e))
        }, Fe = function (t) {
            if (this.t._gsClassPT = this, 1 === t || 0 === t) {
                this.t.setAttribute("class", 0 === t ? this.b : this.e);
                for (var e = this.data, i = this.t.style; e;)e.v ? i[e.p] = e.v : Ie(i, e.p), e = e._next;
                1 === t && this.t._gsClassPT === this && (this.t._gsClassPT = null)
            } else this.t.getAttribute("class") !== this.e && this.t.setAttribute("class", this.e)
        };
        ve("className", {
            parser: function (t, e, r, n, a, o, l) {
                var h, u, f, p, _, c = t.getAttribute("class") || "", d = t.style.cssText;
                if (a = n._classNamePT = new ce(t, r, 0, 0, a, 2), a.setRatio = Fe, a.pr = -11, i = !0, a.b = c, u = K(t, s), f = t._gsClassPT) {
                    for (p = {}, _ = f.data; _;)p[_.p] = 1, _ = _._next;
                    f.setRatio(1)
                }
                return t._gsClassPT = a, a.e = "=" !== e.charAt(1) ? e : c.replace(RegExp("\\s*\\b" + e.substr(2) + "\\b"), "") + ("+" === e.charAt(0) ? " " + e.substr(2) : ""), n._tween._duration && (t.setAttribute("class", a.e), h = J(t, u, K(t), l, p), t.setAttribute("class", c), a.data = h.firstMPT, t.style.cssText = d, a = a.xfirst = n.parse(t, h.difs, a, o)), a
            }
        });
        var Ee = function (t) {
            if ((1 === t || 0 === t) && this.data._totalTime === this.data._totalDuration && "isFromStart" !== this.data.data) {
                var e, i, r, s, n = this.t.style, a = l.transform.parse;
                if ("all" === this.e)n.cssText = "", s = !0; else for (e = this.e.split(" ").join("").split(","), r = e.length; --r > -1;)i = e[r], l[i] && (l[i].parse === a ? s = !0 : i = "transformOrigin" === i ? Pe : l[i].p), Ie(n, i);
                s && (Ie(n, we), this.t._gsTransform && delete this.t._gsTransform)
            }
        };
        for (ve("clearProps", {
            parser: function (t, e, r, s, n) {
                return n = new ce(t, r, 0, 0, n, 2), n.setRatio = Ee, n.e = e, n.pr = -10, n.data = s._tween, i = !0, n
            }
        }), h = "bezier,throwProps,physicsProps,physics2D".split(","), me = h.length; me--;)ye(h[me]);
        h = a.prototype, h._firstPT = h._lastParsedTransform = h._transform = null, h._onInitTween = function (t, e, o) {
            if (!t.nodeType)return !1;
            this._target = t, this._tween = o, this._vars = e, u = e.autoRound, i = !1, r = e.suffixMap || a.suffixMap, s = Q(t, ""), n = this._overwriteProps;
            var l, h, _, d, m, g, v, y, x, T = t.style;
            if (f && "" === T.zIndex && (l = G(t, "zIndex", s), ("auto" === l || "" === l) && this._addLazySet(T, "zIndex", 0)), "string" == typeof e && (d = T.cssText, l = K(t, s), T.cssText = d + ";" + e, l = J(t, l, K(t)).difs, !U && w.test(e) && (l.opacity = parseFloat(RegExp.$1)), e = l, T.cssText = d), this._firstPT = h = this.parse(t, e, null), this._transformType) {
                for (x = 3 === this._transformType, we ? p && (f = !0, "" === T.zIndex && (v = G(t, "zIndex", s), ("auto" === v || "" === v) && this._addLazySet(T, "zIndex", 0)), c && this._addLazySet(T, "WebkitBackfaceVisibility", this._vars.WebkitBackfaceVisibility || (x ? "visible" : "hidden"))) : T.zoom = 1, _ = h; _ && _._next;)_ = _._next;
                y = new ce(t, "transform", 0, 0, null, 2), this._linkCSSP(y, null, _), y.setRatio = x && Se ? Ne : we ? ze : Le, y.data = this._transform || Me(t, s, !0), n.pop()
            }
            if (i) {
                for (; h;) {
                    for (g = h._next, _ = d; _ && _.pr > h.pr;)_ = _._next;
                    (h._prev = _ ? _._prev : m) ? h._prev._next = h : d = h, (h._next = _) ? _._prev = h : m = h, h = g
                }
                this._firstPT = d
            }
            return !0
        }, h.parse = function (t, e, i, n) {
            var a, o, h, f, p, _, c, d, m, g, v = t.style;
            for (a in e)_ = e[a], o = l[a], o ? i = o.parse(t, _, a, this, i, n, e) : (p = G(t, a, s) + "", m = "string" == typeof _, "color" === a || "fill" === a || "stroke" === a || -1 !== a.indexOf("Color") || m && P.test(_) ? (m || (_ = he(_), _ = (_.length > 3 ? "rgba(" : "rgb(") + _.join(",") + ")"), i = de(v, a, p, _, !0, "transparent", i, 0, n)) : !m || -1 === _.indexOf(" ") && -1 === _.indexOf(",") ? (h = parseFloat(p), c = h || 0 === h ? p.substr((h + "").length) : "", ("" === p || "auto" === p) && ("width" === a || "height" === a ? (h = ie(t, a, s), c = "px") : "left" === a || "top" === a ? (h = $(t, a, s), c = "px") : (h = "opacity" !== a ? 0 : 1, c = "")), g = m && "=" === _.charAt(1), g ? (f = parseInt(_.charAt(0) + "1", 10), _ = _.substr(2), f *= parseFloat(_), d = _.replace(x, "")) : (f = parseFloat(_), d = m ? _.substr((f + "").length) || "" : ""), "" === d && (d = a in r ? r[a] : c), _ = f || 0 === f ? (g ? f + h : f) + d : e[a], c !== d && "" !== d && (f || 0 === f) && h && (h = Z(t, a, h, c), "%" === d ? (h /= Z(t, a, 100, "%") / 100, e.strictUnits !== !0 && (p = h + "%")) : "em" === d ? h /= Z(t, a, 1, "em") : "px" !== d && (f = Z(t, a, f, d), d = "px"), g && (f || 0 === f) && (_ = f + h + d)), g && (f += h), !h && 0 !== h || !f && 0 !== f ? void 0 !== v[a] && (_ || "NaN" != _ + "" && null != _) ? (i = new ce(v, a, f || h || 0, 0, i, -1, a, !1, 0, p, _), i.xs0 = "none" !== _ || "display" !== a && -1 === a.indexOf("Style") ? _ : p) : W("invalid " + a + " tween value: " + e[a]) : (i = new ce(v, a, h, f - h, i, 0, a, u !== !1 && ("px" === d || "zIndex" === a), 0, p, _), i.xs0 = d)) : i = de(v, a, p, _, !0, null, i, 0, n)), n && i && !i.plugin && (i.plugin = n);
            return i
        }, h.setRatio = function (t) {
            var e, i, r, s = this._firstPT, n = 1e-6;
            if (1 !== t || this._tween._time !== this._tween._duration && 0 !== this._tween._time)if (t || this._tween._time !== this._tween._duration && 0 !== this._tween._time || this._tween._rawPrevTime === -1e-6)for (; s;) {
                if (e = s.c * t + s.s, s.r ? e = Math.round(e) : n > e && e > -n && (e = 0), s.type)if (1 === s.type)if (r = s.l, 2 === r)s.t[s.p] = s.xs0 + e + s.xs1 + s.xn1 + s.xs2; else if (3 === r)s.t[s.p] = s.xs0 + e + s.xs1 + s.xn1 + s.xs2 + s.xn2 + s.xs3; else if (4 === r)s.t[s.p] = s.xs0 + e + s.xs1 + s.xn1 + s.xs2 + s.xn2 + s.xs3 + s.xn3 + s.xs4; else if (5 === r)s.t[s.p] = s.xs0 + e + s.xs1 + s.xn1 + s.xs2 + s.xn2 + s.xs3 + s.xn3 + s.xs4 + s.xn4 + s.xs5; else {
                    for (i = s.xs0 + e + s.xs1, r = 1; s.l > r; r++)i += s["xn" + r] + s["xs" + (r + 1)];
                    s.t[s.p] = i
                } else-1 === s.type ? s.t[s.p] = s.xs0 : s.setRatio && s.setRatio(t); else s.t[s.p] = e + s.xs0;
                s = s._next
            } else for (; s;)2 !== s.type ? s.t[s.p] = s.b : s.setRatio(t), s = s._next; else for (; s;)2 !== s.type ? s.t[s.p] = s.e : s.setRatio(t), s = s._next
        }, h._enableTransforms = function (t) {
            this._transform = this._transform || Me(this._target, s, !0), this._transformType = this._transform.svg && xe || !t && 3 !== this._transformType ? 2 : 3
        };
        var Ye = function () {
            this.t[this.p] = this.e, this.data._linkCSSP(this, this._next, null, !0)
        };
        h._addLazySet = function (t, e, i) {
            var r = this._firstPT = new ce(t, e, 0, 0, this._firstPT, 2);
            r.e = i, r.setRatio = Ye, r.data = this
        }, h._linkCSSP = function (t, e, i, r) {
            return t && (e && (e._prev = t), t._next && (t._next._prev = t._prev), t._prev ? t._prev._next = t._next : this._firstPT === t && (this._firstPT = t._next, r = !0), i ? i._next = t : r || null !== this._firstPT || (this._firstPT = t), t._next = e, t._prev = i), t
        }, h._kill = function (e) {
            var i, r, s, n = e;
            if (e.autoAlpha || e.alpha) {
                n = {};
                for (r in e)n[r] = e[r];
                n.opacity = 1, n.autoAlpha && (n.visibility = 1)
            }
            return e.className && (i = this._classNamePT) && (s = i.xfirst, s && s._prev ? this._linkCSSP(s._prev, i._next, s._prev._prev) : s === this._firstPT && (this._firstPT = i._next), i._next && this._linkCSSP(i._next, i._next._next, s._prev), this._classNamePT = null), t.prototype._kill.call(this, n)
        };
        var Be = function (t, e, i) {
            var r, s, n, a;
            if (t.slice)for (s = t.length; --s > -1;)Be(t[s], e, i); else for (r = t.childNodes, s = r.length; --s > -1;)n = r[s], a = n.type, n.style && (e.push(K(n)), i && i.push(n)), 1 !== a && 9 !== a && 11 !== a || !n.childNodes.length || Be(n, e, i)
        };
        return a.cascadeTo = function (t, i, r) {
            var s, n, a, o = e.to(t, i, r), l = [o], h = [], u = [], f = [], p = e._internals.reservedProps;
            for (t = o._targets || o.target, Be(t, h, f), o.render(i, !0), Be(t, u), o.render(0, !0), o._enabled(!0), s = f.length; --s > -1;)if (n = J(f[s], h[s], u[s]), n.firstMPT) {
                n = n.difs;
                for (a in r)p[a] && (n[a] = r[a]);
                l.push(e.to(f[s], i, n))
            }
            return l
        }, t.activate([a]), a
    }, !0)
}), _gsScope._gsDefine && _gsScope._gsQueue.pop()(), function (t) {
    "use strict";
    var e = function () {
        return (_gsScope.GreenSockGlobals || _gsScope)[t]
    };
    "function" == typeof define && define.amd ? define(["TweenLite"], e) : "undefined" != typeof module && module.exports && (require("../TweenLite.js"), module.exports = e())
}("CSSPlugin");
/*!
 * VERSION: 1.7.4
 * DATE: 2014-07-17
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 **/
var _gsScope = "undefined" != typeof module && module.exports && "undefined" != typeof global ? global : this || window;
(_gsScope._gsQueue || (_gsScope._gsQueue = [])).push(function () {
    "use strict";
    var t = document.documentElement, e = window, i = function (i, r) {
        var s = "x" === r ? "Width" : "Height", n = "scroll" + s, a = "client" + s, o = document.body;
        return i === e || i === t || i === o ? Math.max(t[n], o[n]) - (e["inner" + s] || Math.max(t[a], o[a])) : i[n] - i["offset" + s]
    }, r = _gsScope._gsDefine.plugin({
        propName: "scrollTo", API: 2, version: "1.7.4", init: function (t, r, s) {
            return this._wdw = t === e, this._target = t, this._tween = s, "object" != typeof r && (r = {y: r}), this.vars = r, this._autoKill = r.autoKill !== !1, this.x = this.xPrev = this.getX(), this.y = this.yPrev = this.getY(), null != r.x ? (this._addTween(this, "x", this.x, "max" === r.x ? i(t, "x") : r.x, "scrollTo_x", !0), this._overwriteProps.push("scrollTo_x")) : this.skipX = !0, null != r.y ? (this._addTween(this, "y", this.y, "max" === r.y ? i(t, "y") : r.y, "scrollTo_y", !0), this._overwriteProps.push("scrollTo_y")) : this.skipY = !0, !0
        }, set: function (t) {
            this._super.setRatio.call(this, t);
            var r = this._wdw || !this.skipX ? this.getX() : this.xPrev, s = this._wdw || !this.skipY ? this.getY() : this.yPrev, n = s - this.yPrev, a = r - this.xPrev;
            this._autoKill && (!this.skipX && (a > 7 || -7 > a) && i(this._target, "x") > r && (this.skipX = !0), !this.skipY && (n > 7 || -7 > n) && i(this._target, "y") > s && (this.skipY = !0), this.skipX && this.skipY && (this._tween.kill(), this.vars.onAutoKill && this.vars.onAutoKill.apply(this.vars.onAutoKillScope || this._tween, this.vars.onAutoKillParams || []))), this._wdw ? e.scrollTo(this.skipX ? r : this.x, this.skipY ? s : this.y) : (this.skipY || (this._target.scrollTop = this.y), this.skipX || (this._target.scrollLeft = this.x)), this.xPrev = this.x, this.yPrev = this.y
        }
    }), s = r.prototype;
    r.max = i, s.getX = function () {
        return this._wdw ? null != e.pageXOffset ? e.pageXOffset : null != t.scrollLeft ? t.scrollLeft : document.body.scrollLeft : this._target.scrollLeft
    }, s.getY = function () {
        return this._wdw ? null != e.pageYOffset ? e.pageYOffset : null != t.scrollTop ? t.scrollTop : document.body.scrollTop : this._target.scrollTop
    }, s._kill = function (t) {
        return t.scrollTo_x && (this.skipX = !0), t.scrollTo_y && (this.skipY = !0), this._super._kill.call(this, t)
    }
}), _gsScope._gsDefine && _gsScope._gsQueue.pop()();
/*!
 * VERSION: 0.0.4
 * DATE: 2014-12-04
 * UPDATES AND DOCS AT: http://www.greensock.com
 *
 * @license Copyright (c) 2008-2014, GreenSock. All rights reserved.
 * This work is subject to the terms at http://www.greensock.com/terms_of_use.html or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 */
var _gsScope = "undefined" != typeof module && module.exports && "undefined" != typeof global ? global : this || window;
(_gsScope._gsQueue || (_gsScope._gsQueue = [])).push(function () {
    "use strict";
    function t(t, e, i, r) {
        return i = parseFloat(i) - parseFloat(t), r = parseFloat(r) - parseFloat(e), Math.sqrt(i * i + r * r)
    }

    function e(t) {
        return "string" != typeof t && t.nodeType || (t = _gsScope.TweenLite.selector(t), t.length && (t = t[0])), t
    }

    function i(t, e, i) {
        var r, s, n = t.indexOf(" ");
        return -1 === n ? (r = void 0 !== i ? i + "" : t, s = t) : (r = t.substr(0, n), s = t.substr(n + 1)), r = -1 !== r.indexOf("%") ? parseFloat(r) / 100 * e : parseFloat(r), s = -1 !== s.indexOf("%") ? parseFloat(s) / 100 * e : parseFloat(s), r > s ? [s, r] : [r, s]
    }

    function r(i) {
        if (!i)return 0;
        i = e(i);
        var r, s, n, a, o, l, h, u, f = i.tagName.toLowerCase();
        if ("path" === f)r = i.getTotalLength() || 0; else if ("rect" === f)s = i.getBBox(), r = 2 * (s.width + s.height); else if ("circle" === f)r = 2 * Math.PI * parseFloat(i.getAttribute("r")); else if ("line" === f)r = t(i.getAttribute("x1"), i.getAttribute("y1"), i.getAttribute("x2"), i.getAttribute("y2")); else if ("polyline" === f || "polygon" === f)for (n = i.getAttribute("points").split(" "), r = 0, o = n[0].split(","), "polygon" === f && (n.push(n[0]), -1 === n[0].indexOf(",") && n.push(n[1])), l = 1; n.length > l; l++)a = n[l].split(","), 1 === a.length && (a[1] = n[l++]), 2 === a.length && (r += t(o[0], o[1], a[0], a[1]) || 0, o = a); else"ellipse" === f && (h = parseFloat(i.getAttribute("rx")), u = parseFloat(i.getAttribute("ry")), r = Math.PI * (3 * (h + u) - Math.sqrt((3 * h + u) * (h + 3 * u))));
        return r || 0
    }

    function s(t, i) {
        if (!t)return [0, 0];
        t = e(t), i = i || r(t) + 1;
        var s = a(t), n = s.strokeDasharray || "", o = parseFloat(s.strokeDashoffset);
        return n = -1 === n.indexOf(" ") ? i : parseFloat(n.split(" ")[0]) || 1e-5, n > i && (n = i), [Math.max(0, -o), n - o]
    }

    var n, a = document.defaultView ? document.defaultView.getComputedStyle : function () {
    };
    n = _gsScope._gsDefine.plugin({
        propName: "drawSVG",
        API: 2,
        version: "0.0.4",
        global: !0,
        overwriteProps: ["drawSVG"],
        init: function (t, e) {
            if (!t.getBBox)return !1;
            var n, a, o, l = r(t) + 1;
            return this._style = t.style, e === !0 || "true" === e ? e = "0 100%" : e ? -1 === (e + "").indexOf(" ") && (e = "0 " + e) : e = "0 0", n = s(t, l), a = i(e, l, n[0]), this._length = l + 10, 0 === n[0] && 0 === a[0] ? (o = Math.max(1e-5, a[1] - l), this._dash = l + o, this._offset = l - n[1] + o, this._addTween(this, "_offset", this._offset, l - a[1] + o, "drawSVG")) : (this._dash = n[1] - n[0] || 1e-6, this._offset = -n[0], this._addTween(this, "_dash", this._dash, a[1] - a[0] || 1e-5, "drawSVG"), this._addTween(this, "_offset", this._offset, -a[0], "drawSVG")), !0
        },
        set: function (t) {
            this._firstPT && (this._super.setRatio.call(this, t), this._style.strokeDashoffset = this._offset, this._style.strokeDasharray = this._dash + " " + this._length)
        }
    }), n.getLength = r, n.getPosition = s
}), _gsScope._gsDefine && _gsScope._gsQueue.pop()();
