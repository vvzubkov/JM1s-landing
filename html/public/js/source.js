var window_h = parseInt(window.innerHeight);
var window_w = parseInt(window.innerWidth);

var scrolled;
var sb = document.getElementsByClassName('scrollBlock');

var header = document.getElementById('header');
var header_h = parseInt(header.clientHeight);
var header_c_bottom = header.getBoundingClientRect().bottom;

var scroll_c = document.querySelector('#ScrollContainer');
var scroll_c_rect;
var scroll_b = document.querySelector('.ScrollBorder');
var scroll_m = document.querySelector('.scrollMenu');

var canvas = document.getElementById('videoCanvas');
var ctx = canvas.getContext('2d');

var video = document.getElementById('videoBlock');
var video_c = document.getElementById('videoContainer');
var vds;
var curT;
var timerId;

var init = function () {
    window_h = parseInt(window.innerHeight);
    window_w = parseInt(window.innerWidth);

    header_h = parseInt(header.clientHeight);
    header_c_bottom = header.getBoundingClientRect().bottom;

    scrollBlockInit();
    gridLineList();

    scroll_b.style.height = (window_h - header_h) + 'px';

    video.preload = "auto";
    video.muted = true;
    vds = video.duration;
    video_c.style.height = (window_h - header_h) + 'px';

    clearTimeout(timerId);

};

var scrollBlockInit = function () {
    for (var i = 0; i < sb.length; i++) {
        sb[i].style.height = (window_h - header_h) + 'px';
        var tdy = parseInt((i + 1) * (window_h - header_h));
        sb[i].style.transform = "translate3D(0," + tdy + "px,0)";
    }
    scroll_c.style.height = ((window_h - header_h) * (sb.length + 2)) + 'px';
};
var gridLineList = function () {
    var grid_line_counr = 49;
    var buttons = 3;
    var grid_c = document.querySelector('.gridLineList');
    var items = [];

    for (var i = 0; i < grid_line_counr; i++) {
        var item = document.createElement('li');
        item.classList.add('gridLine');
        items.push(item);
        grid_c.appendChild(item);
    }
};
var stopScroll = function () {
    clearTimeout(timerId);
};

var autoScroll = function () {
    timerId = setTimeout(function () {
        scrolled = window.pageYOffset || document.documentElement.scrollTop;
        scrolled = Math.ceil(scrolled / 10) * 10;
        vds = parseInt(video.duration);
        curT = parseInt(Math.ceil(video.currentTime));

        var sch = parseInt(scroll_c.getBoundingClientRect().height);
        var step = parseInt(Math.ceil((sch / vds) / 10) * 10);

        if (((Math.ceil(scroll_c.getBoundingClientRect().bottom / 100) * 100) - (Math.ceil(step / 100) * 100)) <= window_h) {
            stopScroll();
        }
        else {
            $('body').animate({scrollTop: (scrolled + step)}, 500, 'easeInOutSine');
            timerId = setTimeout(autoScroll, 250);
        }
    }, 250);
};

window.addEventListener('scroll', function (e) {
    scrolled = window.pageYOffset || document.documentElement.scrollTop;
    scroll_c.rect = scroll_c.getBoundingClientRect();

    if (scroll_c.rect.top < header_c_bottom) {
        scroll_b.style.top = (header_h + 'px');
        scroll_b.classList.add('fixed');
        scroll_m.classList.add('fixed');
        $(scroll_m).animate({opacity:1},1500);

        video_c.style.top = (header_h + 'px');
        video_c.classList.add('fixed');

        for (var i = 0; i < sb.length; i++) {
            if ((Math.ceil(sb[i].getBoundingClientRect().top / 100) * 100) == (Math.ceil(scrolled / 100) * 100)) {

            }
        }
        video.play();
        stopScroll();
        setTimeout(autoScroll(), 2500);
    }
    else if (scroll_c.rect.top > header_c_bottom) {
        scroll_b.classList.remove('fixed');
        scroll_b.style.top = 0;
        scroll_m.classList.remove('fixed');
        $(scroll_m).animate({opacity:0},1);

        video_c.style.top = 0;
        video_c.style.bottom = 'auto';
        video_c.classList.remove('fixed');

        stopScroll();
        video.pause();
    }

    if (scroll_c.rect.bottom < window_h) {
        scroll_b.classList.remove('fixed');
        scroll_b.style.top = 'auto';
        scroll_b.style.bottom = 0;
        scroll_m.classList.remove('fixed');
        $(scroll_m).animate({opacity:0},1);

        video_c.style.top = 'auto';
        video_c.style.bottom = 0;
        video_c.classList.remove('fixed');

        stopScroll();
        video.pause();
    }
}, false);

document.addEventListener('DOMContentLoaded', function () {
    init();
}, false);

window.addEventListener('resize', function () {
    init();
}, false);
