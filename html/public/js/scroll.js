
window.onload = function() {

    function AugmentScroll(type /* slowest|slower|slow|fast|faster|fastest */) {
        this.oldX = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft || 0;
        this.oldY = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.busy = false;
        this.multiplier = 0;
        switch(type) {
            case 'slowest': this.multiplier = -0.9; break;
            case 'slower': this.multiplier = -0.5; break;
            case 'slow': this.multiplier = -0.1; break;
            case 'fast': this.multiplier = 0.1; break;
            case 'faster': this.multiplier = 0.5; break;
            case 'fastest': this.multiplier = 1.0; break;
            case '2x': this.multiplier = 1.0; break;
            case '3x': this.multiplier = 2.0; break;
            case '4x': this.multiplier = 3.0; break;
            case '5x': this.multiplier = 4.0; break;
            default: break;
        }
        window.addEventListener("scroll", this.OnScroll.bind(this), false);
        window.setInterval(this.OnUpdate.bind(this), 100);
    };
    AugmentScroll.prototype.OnScroll = function() {
        if(this.busy) {
            this.busy = false;
        } else {
            var x = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft || 0;
            var y = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || 0;
            this.deltaX = x - this.oldX;
            this.deltaY = y - this.oldY;
        }
        return true;
    };
    AugmentScroll.prototype.OnUpdate = function() {
        var dx = this.deltaX * this.multiplier;
        var dy = this.deltaY * this.multiplier;
        if(dx != 0 || dy != 0) {
            this.busy = true;
            window.scrollBy(dx, dy);
            this.oldX = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft || 0;
            this.oldY = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || 0;
            this.busy = false;
        }
    };
    new AugmentScroll('slow');

};
