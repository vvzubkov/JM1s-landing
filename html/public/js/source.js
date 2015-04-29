var _window_h = parseInt(window.innerHeight);
var _window_w = parseInt(window.innerWidth);

var _header = document.getElementById('header');
var _header_h = parseInt(_header.clientHeight);
var _header_c_bottom = _header.getBoundingClientRect().bottom;

var _scroll_c = document.querySelector('#ScrollContainer');
var _scroll_b = document.querySelector('.ScrollBorder');

var canvas = document.getElementById('videoCanvas');
var ctx = canvas.getContext('2d');
var back = document.createElement('canvas');
var backcontext = back.getContext('2d');

var _video = document.getElementById('videoBlock');
var _video_c = document.getElementById('videoContainer');

var timerId;

function init() {
    _video.preload = "auto";
    _video.muted = true;
    _video_c.style.width = _window_w;
    _video_c.style.height = _window_h;

    _scroll_b.style.height = (_window_h - _header_h) + 'px';
    _video_c.style.height = (_window_h - _header_h) + 'px';

    clearTimeout(timerId);
}

function stopScroll() {
    clearTimeout(timerId);
}

function autoScroll() {
    timerId = setTimeout(function autoScroll() {
        var scrolled = window.pageYOffset || document.documentElement.scrollTop;
        scrolled = Math.ceil(scrolled/100)*100;
        var nt = parseInt(scrolled + (Math.ceil(_window_w/500)*100));
        $('body').animate({scrollTop: nt}, 500);
        timerId = setTimeout(autoScroll, 1500);
    }, 1500);
}

document.addEventListener('DOMContentLoaded', function () {
    init();
}, false);

window.onscroll = function (e) {
    var scrolled = window.pageYOffset || document.documentElement.scrollTop;
    var _scroll_c_rect = _scroll_c.getBoundingClientRect();

    if (_scroll_c_rect.top < _header_c_bottom) {
        _scroll_b.style.top = (_header_h + 'px');
        _scroll_b.classList.add('fixed');

        _video_c.style.top = (_header_h + 'px');
        _video_c.classList.add('fixed');

        _video.play();
        stopScroll();
        setTimeout(autoScroll(),3500);
    }
    else if (_scroll_c_rect.top > _header_c_bottom) {
        _scroll_b.classList.remove('fixed');
        _scroll_b.style.top = 0;

        _video_c.style.top = 0;
        _video_c.style.bottom = 'auto';
        _video_c.classList.remove('fixed');

        stopScroll();
        _video.pause();
    }

    if (_scroll_c_rect.bottom < _window_h) {
        _scroll_b.classList.remove('fixed');
        _scroll_b.style.top = 'auto';
        _scroll_b.style.bottom = 0;

        _video_c.style.top = 'auto';
        _video_c.style.bottom = 0;
        _video_c.classList.remove('fixed');

        stopScroll();
        _video.pause();
    }
};
