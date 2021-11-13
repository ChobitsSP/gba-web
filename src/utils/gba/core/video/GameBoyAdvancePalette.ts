export default class GameBoyAdvancePalette {
  colors: any[][];
  adjustedColors: any[][];
  passthroughColors: any[];
  blendY = 1;

  adjustColor: Function;

  constructor() {
    this.colors = [new Array(0x100), new Array(0x100)];
    this.adjustedColors = [new Array(0x100), new Array(0x100)];
    this.passthroughColors = [
      this.colors[0], // BG0
      this.colors[0], // BG1
      this.colors[0], // BG2
      this.colors[0], // BG3
      this.colors[1], // OBJ
      this.colors[0] // Backdrop
    ];
  }
  overwrite(memory) {
    for (var i = 0; i < 512; ++i) {
      this.store16(i << 1, memory[i]);
    }
  }
  loadU8(offset) {
    return (this.loadU16(offset) >> (8 * (offset & 1))) & 0xFF;
  }
  loadU16(offset) {
    return this.colors[(offset & 0x200) >> 9][(offset & 0x1FF) >> 1];
  }
  load16(offset) {
    return (this.loadU16(offset) << 16) >> 16;
  }
  load32(offset) {
    return this.loadU16(offset) | (this.loadU16(offset + 2) << 16);
  }
  store16(offset, value) {
    var type = (offset & 0x200) >> 9;
    var index = (offset & 0x1FF) >> 1;
    this.colors[type][index] = value;
    this.adjustedColors[type][index] = this.adjustColor(value);
  }
  store32(offset, value) {
    this.store16(offset, value & 0xFFFF);
    this.store16(offset + 2, value >> 16);
  }
  invalidatePage(address) { }
  convert16To32(value, input) {
    var r = (value & 0x001F) << 3;
    var g = (value & 0x03E0) >> 2;
    var b = (value & 0x7C00) >> 7;

    input[0] = r;
    input[1] = g;
    input[2] = b;
  }
  mix(aWeight, aColor, bWeight, bColor) {
    var ar = (aColor & 0x001F);
    var ag = (aColor & 0x03E0) >> 5;
    var ab = (aColor & 0x7C00) >> 10;

    var br = (bColor & 0x001F);
    var bg = (bColor & 0x03E0) >> 5;
    var bb = (bColor & 0x7C00) >> 10;

    var r = Math.min(aWeight * ar + bWeight * br, 0x1F);
    var g = Math.min(aWeight * ag + bWeight * bg, 0x1F);
    var b = Math.min(aWeight * ab + bWeight * bb, 0x1F);

    return r | (g << 5) | (b << 10);
  }
  makeDarkPalettes(layers) {
    if (this.adjustColor != this.adjustColorDark) {
      this.adjustColor = this.adjustColorDark;
      this.resetPalettes();
    }
    this.resetPaletteLayers(layers);
  }
  makeBrightPalettes(layers) {
    if (this.adjustColor != this.adjustColorBright) {
      this.adjustColor = this.adjustColorBright;
      this.resetPalettes();
    }
    this.resetPaletteLayers(layers);
  }
  makeNormalPalettes() {
    this.passthroughColors[0] = this.colors[0];
    this.passthroughColors[1] = this.colors[0];
    this.passthroughColors[2] = this.colors[0];
    this.passthroughColors[3] = this.colors[0];
    this.passthroughColors[4] = this.colors[1];
    this.passthroughColors[5] = this.colors[0];
  }
  makeSpecialPalette(layer) {
    this.passthroughColors[layer] = this.adjustedColors[layer == 4 ? 1 : 0];
  }
  makeNormalPalette(layer) {
    this.passthroughColors[layer] = this.colors[layer == 4 ? 1 : 0];
  }
  resetPaletteLayers(layers) {
    if (layers & 0x01) {
      this.passthroughColors[0] = this.adjustedColors[0];
    }
    else {
      this.passthroughColors[0] = this.colors[0];
    }
    if (layers & 0x02) {
      this.passthroughColors[1] = this.adjustedColors[0];
    }
    else {
      this.passthroughColors[1] = this.colors[0];
    }
    if (layers & 0x04) {
      this.passthroughColors[2] = this.adjustedColors[0];
    }
    else {
      this.passthroughColors[2] = this.colors[0];
    }
    if (layers & 0x08) {
      this.passthroughColors[3] = this.adjustedColors[0];
    }
    else {
      this.passthroughColors[3] = this.colors[0];
    }
    if (layers & 0x10) {
      this.passthroughColors[4] = this.adjustedColors[1];
    }
    else {
      this.passthroughColors[4] = this.colors[1];
    }
    if (layers & 0x20) {
      this.passthroughColors[5] = this.adjustedColors[0];
    }
    else {
      this.passthroughColors[5] = this.colors[0];
    }
  }
  resetPalettes() {
    var i;
    var outPalette = this.adjustedColors[0];
    var inPalette = this.colors[0];
    for (i = 0; i < 256; ++i) {
      outPalette[i] = this.adjustColor(inPalette[i]);
    }

    outPalette = this.adjustedColors[1];
    inPalette = this.colors[1];
    for (i = 0; i < 256; ++i) {
      outPalette[i] = this.adjustColor(inPalette[i]);
    }
  }
  accessColor(layer, index) {
    return this.passthroughColors[layer][index];
  }
  adjustColorDark(color) {
    var r = (color & 0x001F);
    var g = (color & 0x03E0) >> 5;
    var b = (color & 0x7C00) >> 10;

    r = r - (r * this.blendY);
    g = g - (g * this.blendY);
    b = b - (b * this.blendY);

    return r | (g << 5) | (b << 10);
  }
  adjustColorBright(color) {
    var r = (color & 0x001F);
    var g = (color & 0x03E0) >> 5;
    var b = (color & 0x7C00) >> 10;

    r = r + ((31 - r) * this.blendY);
    g = g + ((31 - g) * this.blendY);
    b = b + ((31 - b) * this.blendY);

    return r | (g << 5) | (b << 10);
  }
  setBlendY(y) {
    if (this.blendY != y) {
      this.blendY = y;
      this.resetPalettes();
    }
  }
}

GameBoyAdvancePalette.prototype.adjustColor = GameBoyAdvancePalette.prototype.adjustColorBright;
