var _def_b = document.querySelector('.defaultBlock');
var _top_row = document.querySelector('.topRow');
var _top_row_l = _top_row.querySelector('.leftHalf');
var _top_row_r = _top_row.querySelector('.rightHalf');
var _bottom_row = document.querySelector('.bottomRow');
var _bottom_row_l = _bottom_row.querySelector('.leftHalf');
var _bottom_row_r = _bottom_row.querySelector('.rightHalf');

//_def_b.style.height = (_window_h - _header_h) + 'px';

//_top_row_l.style.height = ((_window_h - _header_h) / 2)+'px';
//_top_row_r.style.height = ((_window_h - _header_h) / 2)+'px';
//_bottom_row_l.style.height = ((_window_h - _header_h) / 2)+'px';
//_bottom_row_r.style.height = ((_window_h - _header_h) / 2)+'px';

//_video.addEventListener('play', function () {
//    var cw, ch;
//    cw = _video_c.clientWidth;
//    ch = _video_c.clientHeight;
//    console.log(cw);
//    console.log(ch);
//    canvas.width = cw;
//    canvas.height = ch;
//    back.width = cw;
//    back.height = ch;
//    draw(_video, ctx, backcontext, cw, ch);
//}, false);

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
