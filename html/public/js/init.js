var _scroll_pos             = window.pageYOffset || document.documentElement.scrollTop;
var _window                 = window;
    _window._height         = parseInt(_window.innerHeight);
    _window._width          = parseInt(_window.innerWidth);
    _window._Ypos           = _scroll_pos;
var _preLoad                = document.querySelector('.preLoader');
var _header                 = document.getElementById('header');
    _header._rect           = header.getBoundingClientRect();
var _top                    = document.getElementById('top');
    _top._rect              = header.getBoundingClientRect();
var _scroll_c               = document.querySelector('#ScrollContainer');
    _scroll_c._rect         = _scroll_c.getBoundingClientRect();
var _scroll_bd              = document.querySelector('.ScrollBorder');
var _scroll_m               = document.querySelector('.scrollMenu');
var _scroll_bls             = document.getElementsByClassName('scrollBlock');
var _grid_l                 = document.querySelector('.gridLineList');
    _grid_l._count          = 49;
    _grid_l._buttons        = [10,25,40];
    _grid_l._items          = [];
var _canvas                 = document.getElementById('videoCanvas');
    _canvas._ctx            = _canvas.getContext('2d');
var _video_c                = document.getElementById('videoContainer');
var _video                  = document.getElementById('videoBlock');
    _video._isPlaying       = false;
var _autoScroll             = false;
var tl                      = new TimelineLite();
var tm                      = new TimelineMax();

var _scroll_direct, vds, curT, timerId;


var init = function () {
    _window._height         = parseInt(_window.innerHeight);
    _window._width          = parseInt(_window.innerWidth);
    _window._Ypos           = parseInt(_window.pageYOffset);
    _header._rect           = _header.getBoundingClientRect();
    _top._rect              = _top.getBoundingClientRect();
    _video.preload          = "auto";
    _video.muted            = true;
    _video_c.style.height   = (_window._height - _header._rect.height) + 'px';
    _scroll_bd.style.height = (_window._height - _header._rect.height) + 'px';
    _scroll_c._rect         = _scroll_c.getBoundingClientRect();
    vds                     = _video.duration;

    scrollBlockInit();
    gridLineList();
    clearTimeout(timerId);
};

var scrollBlockInit = function () {
    for (var i = 0; i < _scroll_bls.length; i++) {
        var _this       = _scroll_bls[i],
            w_h         = _window._height,
            w_h_h       = _window._height - _header._rect.height;

        if (_this.getAttribute('id')) {
            _this._id   = _this.getAttribute('id');
            _this._yt    = parseInt( w_h_h * ( (i * 7) + 2 ));
            _this._yb    = parseInt( w_h_h * ( (i * 7) + 7 ));
            _this.setAttribute('translate-Yt', '' + _this._yt);
            _this.setAttribute('translate-Yb', '' + _this._yb);
        }
        _this._vis = false;
        _this._delta = 0;
        _this.style.height      = w_h_h + 'px';
        _this.style.marginTop   = _header._rect.height + 'px';
        tl.to(_this, 0.01, {y: w_h});
    }
    _scroll_c.style.height = (w_h_h * ((i * 7) + 8)) + 'px';
};

var scrollBlockShow = function (_scroll_pos, _scroll_direct) {
    for (var i = 0; i < _scroll_bls.length; i++) {
        var _this = _scroll_bls[i],
            ceil = 100,
            w_h = _window._height,
            w_h_25 = ((Math.floor(w_h / ceil) * ceil) * 0.25),
            t_Yt = Math.floor(_this._yt / ceil) * ceil,
            t_Yb = Math.floor(_this._yb / ceil) * ceil,
            scr = Math.floor(parseInt(_scroll_pos) / ceil) * ceil;
        _this._rect = _this.getBoundingClientRect();

        if (_scroll_direct == 'down') {
            if ((scr == t_Yt) || ((scr > (t_Yt - w_h_25)) && (scr < (t_Yt + w_h_25))) && !(_this._vis)) {
                tl.to(_this, 1, {y: 0, ease:Sine.easeInOut});
                _this._vis = true;
            }
            if ((scr == t_Yb) || ((scr > (t_Yb - w_h_25)) && (scr < (t_Yb + w_h_25))) && _this._vis) {
                tl.to(_this, 1, { y: (w_h * (-1)), ease:Sine.easeInOut});
                _this._vis = false;
            }
        }
        else if (_scroll_direct == 'up') {
            if ((scr == t_Yb) || ((scr > (t_Yb - w_h_25)) && (scr < (t_Yb + w_h_25))) && !(_this._vis)){
                _this._vis = true;
                tl.to(_this, 1, { y: 0, ease:Sine.easeInOut} );
            }
            if ((scr == t_Yt) || ((scr > (t_Yt - w_h_25)) && (scr < (t_Yt + w_h_25))) && (_this._vis)) {
                _this._vis = false;
                tl.to(_this, 1, { y: w_h, ease:Sine.easeInOut} );
            }
        }
    }
};
var scrollBlockHide = function(_scroll_direct){
    for (var i = 0; i < _scroll_bls.length; i++) {
        var _this = _scroll_bls[i],
            w_h = _window._height;
        if (_scroll_direct == 'down') {
            if (_this._vis) {
                _this._vis = false;
                tl.to(_this, 0.05, { y: (w_h * (-1)), ease:Sine.easeInOut});
            }
        }
        else if (_scroll_direct == 'up') {
            if (_this._vis) {
                _this._vis = false;
                tl.to(_this, 0.05, { y: w_h, ease:Sine.easeInOut} );
            }
        }
    }
};

var gridLineList = function () {
    for (var i = 0; i < _grid_l._count; i++) {
        var item = document.createElement('li');
            item.classList.add('gridLine');
        _grid_l._items.push(item);
        _grid_l.appendChild(item);
    }
};

var stopScroll = function () {
    clearTimeout(timerId);
};

var autoScroll = function () {
    timerId = setTimeout(function () {
        var ceil, sch, step;
        var scroll_pos      = window.pageYOffset || document.documentElement.scrollTop;
        //_scroll_c._rect     = _scroll_c.getBoundingClientRect();
        console.log(scroll_pos);
        _autoScroll         = true;
        ceil                = 100;
        scroll_pos          = Math.ceil(scroll_pos / ceil) * ceil;
        vds                 = parseInt( _video.duration );
        curT                = parseInt( _video.currentTime );
        sch                 = parseInt( _scroll_c._rect.height );
        step                = Math.floor( ( sch / vds ) / ceil ) * ceil ;
        step                = scroll_pos + (step * curT);

        console.log(scroll_pos);

        //$('body').animate({scrollTop: step}, 500, function(){
        //    timerId = setTimeout(autoScroll(), 500);
        //});
    }, 500);
};

window.addEventListener('scroll', function (e) {
    _scroll_pos = window.pageYOffset || document.documentElement.scrollTop;
    if (_window._Ypos < _scroll_pos) _scroll_direct = 'down';
    else if (_window._Ypos > _scroll_pos) _scroll_direct = 'up';
    _window._Ypos = _scroll_pos;

    _scroll_c._rect = _scroll_c.getBoundingClientRect();

    if ( _scroll_c._rect.top < _header._rect.bottom ) {
        if (!_video._isPlaying) {
            _video._isPlaying = true;
            _video_c.style.top = _header._rect.height + 'px';
            _scroll_bd.style.top = _header._rect.height + 'px';
            _scroll_bd.classList.add('fixed');
            _scroll_m.classList.add('fixed');
            _video_c.classList.add('fixed');
            tl.to(_scroll_m, 1.5,{opacity: 1});
            _video.play();
        }
        if (!_autoScroll)
            setTimeout(autoScroll(),500);
        scrollBlockShow( _scroll_pos, _scroll_direct );
    }
    else if (_scroll_c._rect.top > _header._rect.bottom) {
        if (_video._isPlaying) {
            _video.pause();
            _video._isPlaying = false;
            _scroll_bd.classList.remove('fixed');
            _scroll_bd.style.top = 0;
            _scroll_m.classList.remove('fixed');
            _video_c.style.top = 0;
            _video_c.style.bottom = 'auto';
            _video_c.classList.remove('fixed');
            tl.to(_scroll_m, 0.01,{opacity: 0});
        }
        console.log('top-break');
        stopScroll();
        scrollBlockHide( _scroll_direct );
    }

    if (_scroll_c._rect.bottom < _window._height) {
        if (_video._isPlaying) {
            _video.pause();
            _video._isPlaying = false;
            _scroll_bd.classList.remove('fixed');
            _scroll_bd.style.top = 'auto';
            _scroll_bd.style.bottom = 0;
            _scroll_m.classList.remove('fixed');
            _video_c.style.top = 'auto';
            _video_c.style.bottom = 0;
            _video_c.classList.remove('fixed');
            tl.to(_scroll_m, 0.01,{opacity: 0});
        }
        console.log('bottom-break');
        stopScroll();
        scrollBlockHide( _scroll_direct );
    }
}, false);

document.addEventListener('DOMContentLoaded', function (e) {
    init();
    setTimeout(function () {
        _preLoad.style.display = 'none';
    }, 3500);
}, false);

window.addEventListener('load', function (e) {
    tl.to(('body'), 0.01, { scrollTop: 0 });
    tl.to(_preLoad, 4, {opacity: 0});
}, false);



