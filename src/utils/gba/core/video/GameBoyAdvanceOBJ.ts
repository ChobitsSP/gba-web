import GameBoyAdvanceSoftwareRenderer from "./GameBoyAdvanceSoftwareRenderer"

export default class GameBoyAdvanceOBJ {
  TILE_OFFSET = 0x10000;

  x = 0;
  y = 0;
  scalerot = 0;
  doublesize = false;
  disable = 1;
  mode = 0;
  mosaic = false;
  multipalette = false;
  shape = 0;
  scalerotParam = 0;
  hflip = 0;
  vflip = 0;
  tileBase = 0;
  priority = 0;
  palette = 0;

  cachedWidth = 8;
  cachedHeight = 8;

  oam: any;
  index: any;
  drawScanline: Function;
  pushPixel: Function;

  scalerotOam: any;

  size: number;

  constructor(oam, index) {
    this.oam = oam;
    this.index = index;
    this.drawScanline = this.drawScanlineNormal;
    this.pushPixel = GameBoyAdvanceSoftwareRenderer.pushPixel;
  }
  drawScanlineNormal(backing, y, yOff, start, end) {
    var video = this.oam.video;
    var x;
    var underflow;
    var offset;
    var mask = this.mode | video.target2[video.LAYER_OBJ] | (this.priority << 1);
    if (this.mode == 0x10) {
      mask |= video.TARGET1_MASK;
    }
    if (video.blendMode == 1 && video.alphaEnabled) {
      mask |= video.target1[video.LAYER_OBJ];
    }

    var totalWidth = this.cachedWidth;
    if (this.x < video.HORIZONTAL_PIXELS) {
      if (this.x < start) {
        underflow = start - this.x;
        offset = start;
      }
      else {
        underflow = 0;
        offset = this.x;
      }
      if (end < this.cachedWidth + this.x) {
        totalWidth = end - this.x;
      }
    }
    else {
      underflow = start + 512 - this.x;
      offset = start;
      if (end < this.cachedWidth - underflow) {
        totalWidth = end;
      }
    }

    var localX;
    var localY;
    if (!this.vflip) {
      localY = y - yOff;
    }
    else {
      localY = this.cachedHeight - y + yOff - 1;
    }
    var localYLo = localY & 0x7;
    var mosaicX;
    var tileOffset;

    var paletteShift = this.multipalette ? 1 : 0;

    if (video.objCharacterMapping) {
      tileOffset = ((localY & 0x01F8) * this.cachedWidth) >> 6;
    }
    else {
      tileOffset = (localY & 0x01F8) << (2 - paletteShift);
    }

    if (this.mosaic) {
      mosaicX = video.objMosaicX - 1 - (video.objMosaicX + offset - 1) % video.objMosaicX;
      offset += mosaicX;
      underflow += mosaicX;
    }
    if (!this.hflip) {
      localX = underflow;
    }
    else {
      localX = this.cachedWidth - underflow - 1;
    }

    var tileRow = video.accessTile(this.TILE_OFFSET + (x & 0x4) * paletteShift, this.tileBase + (tileOffset << paletteShift) + ((localX & 0x01F8) >> (3 - paletteShift)), localYLo << paletteShift);
    for (x = underflow; x < totalWidth; ++x) {
      mosaicX = this.mosaic ? offset % video.objMosaicX : 0;
      if (!this.hflip) {
        localX = x - mosaicX;
      }
      else {
        localX = this.cachedWidth - (x - mosaicX) - 1;
      }
      if (!paletteShift) {
        if (!(x & 0x7) || (this.mosaic && !mosaicX)) {
          tileRow = video.accessTile(this.TILE_OFFSET, this.tileBase + tileOffset + (localX >> 3), localYLo);
        }
      }
      else {
        if (!(x & 0x3) || (this.mosaic && !mosaicX)) {
          tileRow = video.accessTile(this.TILE_OFFSET + (localX & 0x4), this.tileBase + (tileOffset << 1) + ((localX & 0x01F8) >> 2), localYLo << 1);
        }
      }
      this.pushPixel(video.LAYER_OBJ, this, video, tileRow, localX & 0x7, offset, backing, mask, false);
      offset++;
    }
  }
  drawScanlineAffine(backing, y, yOff, start, end) {
    var video = this.oam.video;
    var x;
    var underflow;
    var offset;
    var mask = this.mode | video.target2[video.LAYER_OBJ] | (this.priority << 1);
    if (this.mode == 0x10) {
      mask |= video.TARGET1_MASK;
    }
    if (video.blendMode == 1 && video.alphaEnabled) {
      mask |= video.target1[video.LAYER_OBJ];
    }

    var localX;
    var localY;
    var yDiff = y - yOff;
    var tileOffset;

    var paletteShift = this.multipalette ? 1 : 0;
    var totalWidth = this.cachedWidth << +this.doublesize;
    var totalHeight = this.cachedHeight << +this.doublesize;
    var drawWidth = totalWidth;
    if (drawWidth > video.HORIZONTAL_PIXELS) {
      totalWidth = video.HORIZONTAL_PIXELS;
    }

    if (this.x < video.HORIZONTAL_PIXELS) {
      if (this.x < start) {
        underflow = start - this.x;
        offset = start;
      }
      else {
        underflow = 0;
        offset = this.x;
      }
      if (end < drawWidth + this.x) {
        drawWidth = end - this.x;
      }
    }
    else {
      underflow = start + 512 - this.x;
      offset = start;
      if (end < drawWidth - underflow) {
        drawWidth = end;
      }
    }

    for (x = underflow; x < drawWidth; ++x) {
      localX = this.scalerotOam.a * (x - (totalWidth >> 1)) + this.scalerotOam.b * (yDiff - (totalHeight >> 1)) + (this.cachedWidth >> 1);
      localY = this.scalerotOam.c * (x - (totalWidth >> 1)) + this.scalerotOam.d * (yDiff - (totalHeight >> 1)) + (this.cachedHeight >> 1);
      if (this.mosaic) {
        localX -= (x % video.objMosaicX) * this.scalerotOam.a + (y % video.objMosaicY) * this.scalerotOam.b;
        localY -= (x % video.objMosaicX) * this.scalerotOam.c + (y % video.objMosaicY) * this.scalerotOam.d;
      }

      if (localX < 0 || localX >= this.cachedWidth || localY < 0 || localY >= this.cachedHeight) {
        offset++;
        continue;
      }

      if (video.objCharacterMapping) {
        tileOffset = ((localY & 0x01F8) * this.cachedWidth) >> 6;
      }
      else {
        tileOffset = (localY & 0x01F8) << (2 - paletteShift);
      }
      var tileRow = video.accessTile(this.TILE_OFFSET + (localX & 0x4) * paletteShift, this.tileBase + (tileOffset << paletteShift) + ((localX & 0x01F8) >> (3 - paletteShift)), (localY & 0x7) << paletteShift);
      this.pushPixel(video.LAYER_OBJ, this, video, tileRow, localX & 0x7, offset, backing, mask, false);
      offset++;
    }
  }
  recalcSize() {
    switch (this.shape) {
      case 0:
        // Square
        this.cachedHeight = this.cachedWidth = 8 << this.size;
        break;
      case 1:
        // Horizontal
        switch (this.size) {
          case 0:
            this.cachedHeight = 8;
            this.cachedWidth = 16;
            break;
          case 1:
            this.cachedHeight = 8;
            this.cachedWidth = 32;
            break;
          case 2:
            this.cachedHeight = 16;
            this.cachedWidth = 32;
            break;
          case 3:
            this.cachedHeight = 32;
            this.cachedWidth = 64;
            break;
        }
        break;
      case 2:
        // Vertical
        switch (this.size) {
          case 0:
            this.cachedHeight = 16;
            this.cachedWidth = 8;
            break;
          case 1:
            this.cachedHeight = 32;
            this.cachedWidth = 8;
            break;
          case 2:
            this.cachedHeight = 32;
            this.cachedWidth = 16;
            break;
          case 3:
            this.cachedHeight = 64;
            this.cachedWidth = 32;
            break;
        }
        break;
      default:
      // Bad!
    }
  }
}