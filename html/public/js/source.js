var _window_h = parseInt(window.innerHeight);
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
var _def_b = document.querySelector('.defaultBlock');

document.addEventListener('DOMContentLoaded', function () {
    _video.preload = "auto";
    _video.muted = true;
    _scroll_b.style.height = (_window_h - _header_h) + 'px';
    _def_b.style.height = (_window_h - _header_h) + 'px';
    _def_b.style.top = "-" + _header_h + 'px';

    _video.addEventListener('pause', function () {
        var cw, ch;
        cw = _video.clientWidth;
        ch = _video.clientHeight;
        canvas.width = cw;
        canvas.height = ch;
        back.width = cw;
        back.height = ch;
        draw(_video, ctx, backcontext, cw, ch);
    }, false);
}, false);


function draw(v, c, bc, w, h) {
    if (v.paused || v.ended) return false;
    // First, draw it into the backing canvas
    bc.drawImage(v, 0, 0, w, h);
    // Grab the pixel data from the backing canvas
    var idata = bc.getImageData(0, 0, w, h);
    var data = idata.data;
    // Loop through the pixels, turning them grayscale
    for (var i = 0; i < data.length; i += 4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        var brightness = (3 * r + 4 * g + b) >>> 3;
        data[i] = brightness;
        data[i + 1] = brightness;
        data[i + 2] = brightness;
    }
    idata.data = data;
    // Draw the pixels onto the visible canvas
    c.putImageData(idata, 0, 0);
    // Start over!
    setTimeout(function () {
        draw(v, c, bc, w, h);
    }, 0);
}

window.onscroll = function (e) {
    var scrolled = window.pageYOffset || document.documentElement.scrollTop;

    if (_scroll_c.getBoundingClientRect().top < _header_c_bottom) {
        _scroll_b.style.top = (_header_h + 'px');
        _scroll_b.classList.add('fixed');
        _video_c.classList.add('fixed');
        _video.play();
    }
    else if (_scroll_c.getBoundingClientRect().top > _header_c_bottom) {
        _scroll_b.classList.remove('fixed');
        _scroll_b.style.top = 0;
        _video_c.style.top = 0;
        _video_c.style.bottom = 'auto';
        _video_c.classList.remove('fixed');
        _video.pause();
    }

    if (_scroll_c.getBoundingClientRect().bottom < _window_h) {
        _scroll_b.classList.remove('fixed');
        _scroll_b.style.top = 'auto';
        _scroll_b.style.bottom = 0;
        _video_c.style.top = 'auto';
        _video_c.style.bottom = 0;
        _video_c.classList.remove('fixed');
        _video.pause();
    }
};
