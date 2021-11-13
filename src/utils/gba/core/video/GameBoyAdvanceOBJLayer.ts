export default class GameBoyAdvanceOBJLayer {
  bg = false;
  enabled: boolean | number = false;
  objwin = 0;

  video: any;
  index: any;
  priority: any;

  constructor(video, index) {
    this.video = video;
    this.index = video.LAYER_OBJ;
    this.priority = index;
  }

  drawScanline(backing, layer, start, end) {
    var y = this.video.vcount;
    var wrappedY;
    var mosaicY;
    var obj;
    if (start >= end) {
      return;
    }
    var objs = this.video.oam.objs;
    for (var i = 0; i < objs.length; ++i) {
      obj = objs[i];
      if (obj.disable) {
        continue;
      }
      if ((obj.mode & this.video.OBJWIN_MASK) != this.objwin) {
        continue;
      }
      if (!(obj.mode & this.video.OBJWIN_MASK) && this.priority != obj.priority) {
        continue;
      }
      if (obj.y < this.video.VERTICAL_PIXELS) {
        wrappedY = obj.y;
      }
      else {
        wrappedY = obj.y - 256;
      }
      var totalHeight;
      if (!obj.scalerot) {
        totalHeight = obj.cachedHeight;
      }
      else {
        totalHeight = obj.cachedHeight << obj.doublesize;
      }
      if (!obj.mosaic) {
        mosaicY = y;
      }
      else {
        mosaicY = y - y % this.video.objMosaicY;
      }
      if (wrappedY <= y && (wrappedY + totalHeight) > y) {
        obj.drawScanline(backing, mosaicY, wrappedY, start, end);
      }
    }
  }
  objComparator(a, b) {
    return a.index - b.index;
  }
}
