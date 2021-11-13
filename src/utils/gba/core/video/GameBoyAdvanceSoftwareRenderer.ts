import GameBoyAdvancePalette from "./GameBoyAdvancePalette";
import GameBoyAdvanceVRAM from "./GameBoyAdvanceVRAM";
import GameBoyAdvanceOAM from "./GameBoyAdvanceOAM";
import GameBoyAdvanceOBJLayer from "./GameBoyAdvanceOBJLayer";

export default class GameBoyAdvanceSoftwareRenderer {
  LAYER_BG0 = 0;
  LAYER_BG1 = 1;
  LAYER_BG2 = 2;
  LAYER_BG3 = 3;
  LAYER_OBJ = 4;
  LAYER_BACKDROP = 5;

  HORIZONTAL_PIXELS = 240;
  VERTICAL_PIXELS = 160;

  LAYER_MASK = 0x06;
  BACKGROUND_MASK = 0x01;
  TARGET2_MASK = 0x08;
  TARGET1_MASK = 0x10;
  OBJWIN_MASK = 0x20;
  WRITTEN_MASK = 0x80;

  PRIORITY_MASK: number;

  drawBackdrop: any;

  palette: GameBoyAdvancePalette;
  vram: GameBoyAdvanceVRAM;
  oam: GameBoyAdvanceOAM;

  objLayers: GameBoyAdvanceOBJLayer[];
  objwinLayer: GameBoyAdvanceOBJLayer;

  backgroundMode = 0;
  displayFrameSelect = 0;
  hblankIntervalFree = 0;
  objCharacterMapping = 0;
  forcedBlank = 1;
  win0 = 0;
  win1 = 0;
  objwin = 0;

  // VCOUNT
  vcount = -1;

  // WIN0H
  win0Left = 0;
  win0Right = 240;

  // WIN1H
  win1Left = 0;
  win1Right = 240;

  // WIN0V
  win0Top = 0;
  win0Bottom = 160;

  // WIN1V
  win1Top = 0;
  win1Bottom = 160;

  // BLDCNT
  target1 = new Array(5);
  target2 = new Array(5);
  blendMode = 0;

  // BLDALPHA
  blendA = 0;
  blendB = 0;

  // BLDY
  blendY = 0;

  // MOSAIC
  bgMosaicX = 1;
  bgMosaicY = 1;
  objMosaicX = 1;
  objMosaicY = 1;

  lastHblank = 0;
  nextHblank: any;
  nextEvent: any;

  nextHblankIRQ = 0;
  nextVblankIRQ = 0;
  nextVcounterIRQ = 0;
  HDRAW_LENGTH: number;

  windows: { enabled: any[], special: number }[];

  bg: any[];

  bgModes: any[];
  drawLayers: any[];

  objwinActive = false;
  alphaEnabled = false;

  scanline: any;
  sharedColor: number[];
  sharedMap: any;

  pixelData: any;

  static multipalette: boolean;

  video: any;
  mosaic: boolean;

  constructor() {
    this.PRIORITY_MASK = this.LAYER_MASK | this.BACKGROUND_MASK;

    this.drawBackdrop = new (function (video) {
      this.bg = true;
      this.priority = -1;
      this.index = video.LAYER_BACKDROP;
      this.enabled = true;

      this.drawScanline = function (backing, layer, start, end) {
        // TODO: interactions with blend modes and OBJWIN
        for (var x = start; x < end; ++x) {
          if (!(backing.stencil[x] & video.WRITTEN_MASK)) {
            backing.color[x] = video.palette.accessColor(this.index, 0);
            backing.stencil[x] = video.WRITTEN_MASK;
          }
          else if (backing.stencil[x] & video.TARGET1_MASK) {
            backing.color[x] = video.palette.mix(video.blendB, video.palette.accessColor(this.index, 0), video.blendA, backing.color[x]);
            backing.stencil[x] = video.WRITTEN_MASK;
          }
        }
      };
    })(this);
  }
  clear(mmu) {
    this.palette = new GameBoyAdvancePalette();
    this.vram = new GameBoyAdvanceVRAM(mmu.SIZE_VRAM);
    this.oam = new GameBoyAdvanceOAM(mmu.SIZE_OAM);
    this.oam.video = this;
    this.objLayers = [
      new GameBoyAdvanceOBJLayer(this, 0),
      new GameBoyAdvanceOBJLayer(this, 1),
      new GameBoyAdvanceOBJLayer(this, 2),
      new GameBoyAdvanceOBJLayer(this, 3)
    ];
    this.objwinLayer = new GameBoyAdvanceOBJLayer(this, 4);
    this.objwinLayer.objwin = this.OBJWIN_MASK;

    // DISPCNT
    this.backgroundMode = 0;
    this.displayFrameSelect = 0;
    this.hblankIntervalFree = 0;
    this.objCharacterMapping = 0;
    this.forcedBlank = 1;
    this.win0 = 0;
    this.win1 = 0;
    this.objwin = 0;

    // VCOUNT
    this.vcount = -1;

    // WIN0H
    this.win0Left = 0;
    this.win0Right = 240;

    // WIN1H
    this.win1Left = 0;
    this.win1Right = 240;

    // WIN0V
    this.win0Top = 0;
    this.win0Bottom = 160;

    // WIN1V
    this.win1Top = 0;
    this.win1Bottom = 160;

    // WININ/WINOUT
    this.windows = new Array();
    for (var i = 0; i < 4; ++i) {
      this.windows.push({
        enabled: [false, false, false, false, false, true],
        special: 0
      });
    };

    // BLDCNT
    this.target1 = new Array(5);
    this.target2 = new Array(5);
    this.blendMode = 0;

    // BLDALPHA
    this.blendA = 0;
    this.blendB = 0;

    // BLDY
    this.blendY = 0;

    // MOSAIC
    this.bgMosaicX = 1;
    this.bgMosaicY = 1;
    this.objMosaicX = 1;
    this.objMosaicY = 1;

    this.lastHblank = 0;
    this.nextHblank = this.HDRAW_LENGTH;
    this.nextEvent = this.nextHblank;

    this.nextHblankIRQ = 0;
    this.nextVblankIRQ = 0;
    this.nextVcounterIRQ = 0;

    this.bg = new Array();
    for (var i = 0; i < 4; ++i) {
      this.bg.push({
        bg: true,
        index: i,
        enabled: false,
        video: this,
        vram: this.vram,
        priority: 0,
        charBase: 0,
        mosaic: false,
        multipalette: false,
        screenBase: 0,
        overflow: 0,
        size: 0,
        x: 0,
        y: 0,
        refx: 0,
        refy: 0,
        dx: 1,
        dmx: 0,
        dy: 0,
        dmy: 1,
        sx: 0,
        sy: 0,
        pushPixel: GameBoyAdvanceSoftwareRenderer.pushPixel,
        drawScanline: this.drawScanlineBGMode0
      });
    }

    this.bgModes = [
      this.drawScanlineBGMode0,
      this.drawScanlineBGMode2, // Modes 1 and 2 are identical for layers 2 and 3
      this.drawScanlineBGMode2,
      this.drawScanlineBGMode3,
      this.drawScanlineBGMode4,
      this.drawScanlineBGMode5
    ];

    this.drawLayers = [
      this.bg[0],
      this.bg[1],
      this.bg[2],
      this.bg[3],
      this.objLayers[0],
      this.objLayers[1],
      this.objLayers[2],
      this.objLayers[3],
      this.objwinLayer,
      this.drawBackdrop
    ];

    this.objwinActive = false;
    this.alphaEnabled = false;

    this.scanline = {
      color: new Uint16Array(this.HORIZONTAL_PIXELS),
      // Stencil format:
      // Bits 0-1: Layer
      // Bit 2: Is background
      // Bit 3: Is Target 2
      // Bit 4: Is Target 1
      // Bit 5: Is OBJ Window
      // Bit 6: Reserved
      // Bit 7: Has been written
      stencil: new Uint8Array(this.HORIZONTAL_PIXELS)
    };
    this.sharedColor = [0, 0, 0];
    this.sharedMap = {
      tile: 0,
      hflip: false,
      vflip: false,
      palette: 0
    };
  }
  clearSubsets(mmu, regions) {
    if (regions & 0x04) {
      this.palette.overwrite(new Uint16Array(mmu.SIZE_PALETTE >> 1));
    }

    if (regions & 0x08) {
      this.vram.insert(0, new Uint16Array(mmu.SIZE_VRAM >> 1));
    }

    if (regions & 0x10) {
      this.oam.overwrite(new Uint16Array(mmu.SIZE_OAM >> 1));
      this.oam.video = this;
    }
  }
  freeze() {
  }
  defrost(frost) {
  }
  setBacking(backing) {
    this.pixelData = backing;

    // Clear backing first
    for (var offset = 0; offset < this.HORIZONTAL_PIXELS * this.VERTICAL_PIXELS * 4;) {
      this.pixelData.data[offset++] = 0xFF;
      this.pixelData.data[offset++] = 0xFF;
      this.pixelData.data[offset++] = 0xFF;
      this.pixelData.data[offset++] = 0xFF;
    }
  }
  writeDisplayControl(value) {
    this.backgroundMode = value & 0x0007;
    this.displayFrameSelect = value & 0x0010;
    this.hblankIntervalFree = value & 0x0020;
    this.objCharacterMapping = value & 0x0040;
    this.forcedBlank = value & 0x0080;
    this.bg[0].enabled = value & 0x0100;
    this.bg[1].enabled = value & 0x0200;
    this.bg[2].enabled = value & 0x0400;
    this.bg[3].enabled = value & 0x0800;
    this.objLayers[0].enabled = value & 0x1000;
    this.objLayers[1].enabled = value & 0x1000;
    this.objLayers[2].enabled = value & 0x1000;
    this.objLayers[3].enabled = value & 0x1000;
    this.win0 = value & 0x2000;
    this.win1 = value & 0x4000;
    this.objwin = value & 0x8000;
    this.objwinLayer.enabled = value & 0x1000 && value & 0x8000;

    // Total hack so we can store both things that would set it to 256-color mode in the same variable
    this.bg[2].multipalette &= ~0x0001;
    this.bg[3].multipalette &= ~0x0001;
    if (this.backgroundMode > 0) {
      this.bg[2].multipalette |= 0x0001;
    }
    if (this.backgroundMode == 2) {
      this.bg[3].multipalette |= 0x0001;
    }

    this.resetLayers();
  }
  writeBackgroundControl(bg, value) {
    var bgData = this.bg[bg];
    bgData.priority = value & 0x0003;
    bgData.charBase = (value & 0x000C) << 12;
    bgData.mosaic = value & 0x0040;
    bgData.multipalette &= ~0x0080;
    if (bg < 2 || this.backgroundMode == 0) {
      bgData.multipalette |= value & 0x0080;
    }
    bgData.screenBase = (value & 0x1F00) << 3;
    bgData.overflow = value & 0x2000;
    bgData.size = (value & 0xC000) >> 14;

    this.drawLayers.sort(this.layerComparator);
  }
  writeBackgroundHOffset(bg, value) {
    this.bg[bg].x = value & 0x1FF;
  }
  writeBackgroundVOffset(bg, value) {
    this.bg[bg].y = value & 0x1FF;
  }
  writeBackgroundRefX(bg, value) {
    this.bg[bg].refx = (value << 4) / 0x1000;
    this.bg[bg].sx = this.bg[bg].refx;
  }
  writeBackgroundRefY(bg, value) {
    this.bg[bg].refy = (value << 4) / 0x1000;
    this.bg[bg].sy = this.bg[bg].refy;
  }
  writeBackgroundParamA(bg, value) {
    this.bg[bg].dx = (value << 16) / 0x1000000;
  }
  writeBackgroundParamB(bg, value) {
    this.bg[bg].dmx = (value << 16) / 0x1000000;
  }
  writeBackgroundParamC(bg, value) {
    this.bg[bg].dy = (value << 16) / 0x1000000;
  }
  writeBackgroundParamD(bg, value) {
    this.bg[bg].dmy = (value << 16) / 0x1000000;
  }
  writeWin0H(value) {
    this.win0Left = (value & 0xFF00) >> 8;
    this.win0Right = Math.min(this.HORIZONTAL_PIXELS, value & 0x00FF);
    if (this.win0Left > this.win0Right) {
      this.win0Right = this.HORIZONTAL_PIXELS;
    }
  }
  writeWin1H(value) {
    this.win1Left = (value & 0xFF00) >> 8;
    this.win1Right = Math.min(this.HORIZONTAL_PIXELS, value & 0x00FF);
    if (this.win1Left > this.win1Right) {
      this.win1Right = this.HORIZONTAL_PIXELS;
    }
  }
  writeWin0V(value) {
    this.win0Top = (value & 0xFF00) >> 8;
    this.win0Bottom = Math.min(this.VERTICAL_PIXELS, value & 0x00FF);
    if (this.win0Top > this.win0Bottom) {
      this.win0Bottom = this.VERTICAL_PIXELS;
    }
  }
  writeWin1V(value) {
    this.win1Top = (value & 0xFF00) >> 8;
    this.win1Bottom = Math.min(this.VERTICAL_PIXELS, value & 0x00FF);
    if (this.win1Top > this.win1Bottom) {
      this.win1Bottom = this.VERTICAL_PIXELS;
    }
  }
  writeWindow(index, value) {
    var window = this.windows[index];
    window.enabled[0] = value & 0x01;
    window.enabled[1] = value & 0x02;
    window.enabled[2] = value & 0x04;
    window.enabled[3] = value & 0x08;
    window.enabled[4] = value & 0x10;
    window.special = value & 0x20;
  }
  writeWinIn(value) {
    this.writeWindow(0, value);
    this.writeWindow(1, value >> 8);
  }
  writeWinOut(value) {
    this.writeWindow(2, value);
    this.writeWindow(3, value >> 8);
  }
  writeBlendControl(value) {
    this.target1[0] = +!!(value & 0x0001) * this.TARGET1_MASK;
    this.target1[1] = +!!(value & 0x0002) * this.TARGET1_MASK;
    this.target1[2] = +!!(value & 0x0004) * this.TARGET1_MASK;
    this.target1[3] = +!!(value & 0x0008) * this.TARGET1_MASK;
    this.target1[4] = +!!(value & 0x0010) * this.TARGET1_MASK;
    this.target1[5] = +!!(value & 0x0020) * this.TARGET1_MASK;
    this.target2[0] = +!!(value & 0x0100) * this.TARGET2_MASK;
    this.target2[1] = +!!(value & 0x0200) * this.TARGET2_MASK;
    this.target2[2] = +!!(value & 0x0400) * this.TARGET2_MASK;
    this.target2[3] = +!!(value & 0x0800) * this.TARGET2_MASK;
    this.target2[4] = +!!(value & 0x1000) * this.TARGET2_MASK;
    this.target2[5] = +!!(value & 0x2000) * this.TARGET2_MASK;
    this.blendMode = (value & 0x00C0) >> 6;

    switch (this.blendMode) {
      case 1:
      // Alpha
      // Fall through
      case 0:
        // Normal
        this.palette.makeNormalPalettes();
        break;
      case 2:
        // Brighter
        this.palette.makeBrightPalettes(value & 0x3F);
        break;
      case 3:
        // Darker
        this.palette.makeDarkPalettes(value & 0x3F);
        break;
    }
  }
  setBlendEnabled(layer, enabled, override) {
    this.alphaEnabled = enabled && override == 1;
    if (enabled) {
      switch (override) {
        case 1:
        // Alpha
        // Fall through
        case 0:
          // Normal
          this.palette.makeNormalPalette(layer);
          break;
        case 2:
        // Brighter
        case 3:
          // Darker
          this.palette.makeSpecialPalette(layer);
          break;
      }
    }
    else {
      this.palette.makeNormalPalette(layer);
    }
  }
  writeBlendAlpha(value) {
    this.blendA = (value & 0x001F) / 16;
    if (this.blendA > 1) {
      this.blendA = 1;
    }
    this.blendB = ((value & 0x1F00) >> 8) / 16;
    if (this.blendB > 1) {
      this.blendB = 1;
    }
  }
  writeBlendY(value) {
    this.blendY = value;
    this.palette.setBlendY(value >= 16 ? 1 : (value / 16));
  }
  writeMosaic(value) {
    this.bgMosaicX = (value & 0xF) + 1;
    this.bgMosaicY = ((value >> 4) & 0xF) + 1;
    this.objMosaicX = ((value >> 8) & 0xF) + 1;
    this.objMosaicY = ((value >> 12) & 0xF) + 1;
  }
  resetLayers() {
    if (this.backgroundMode > 1) {
      this.bg[0].enabled = false;
      this.bg[1].enabled = false;
    }
    if (this.bg[2].enabled) {
      this.bg[2].drawScanline = this.bgModes[this.backgroundMode];
    }
    if ((this.backgroundMode == 0 || this.backgroundMode == 2)) {
      if (this.bg[3].enabled) {
        this.bg[3].drawScanline = this.bgModes[this.backgroundMode];
      }
    }
    else {
      this.bg[3].enabled = false;
    }
    this.drawLayers.sort(this.layerComparator);
  }
  layerComparator(a, b) {
    var diff = b.priority - a.priority;
    if (!diff) {
      if (a.bg && !b.bg) {
        return -1;
      }
      else if (!a.bg && b.bg) {
        return 1;
      }

      return b.index - a.index;
    }
    return diff;
  }
  accessMapMode0(base, size, x, yBase, out) {
    var offset = base + ((x >> 2) & 0x3E) + yBase;

    if (size & 1) {
      offset += (x & 0x100) << 3;
    }

    var mem = this.vram.loadU16(offset);
    out.tile = mem & 0x03FF;
    out.hflip = mem & 0x0400;
    out.vflip = mem & 0x0800;
    out.palette = (mem & 0xF000) >> 8; // This is shifted up 4 to make pushPixel faster
  }
  accessMapMode1(base, size, x, yBase, out) {
    var offset = base + (x >> 3) + yBase;

    out.tile = this.vram.loadU8(offset);
  }
  accessTile(base, tile, y) {
    var offset = base + (tile << 5);
    offset |= y << 2;

    return this.vram.load32(offset);
  }
  static pushPixel(layer, map, video, row, x, offset, backing, mask, raw) {
    var index;
    if (!raw) {
      if (this.multipalette) {
        index = (row >> (x << 3)) & 0xFF;
      }
      else {
        index = (row >> (x << 2)) & 0xF;
      }
      // Index 0 is transparent
      if (!index) {
        return;
      }
      else if (!this.multipalette) {
        index |= map.palette;
      }
    }

    var stencil = video.WRITTEN_MASK;
    var oldStencil = backing.stencil[offset];
    var blend = video.blendMode;
    if (video.objwinActive) {
      if (oldStencil & video.OBJWIN_MASK) {
        if (video.windows[3].enabled[layer]) {
          video.setBlendEnabled(layer, video.windows[3].special && video.target1[layer], blend);
          if (video.windows[3].special && video.alphaEnabled) {
            mask |= video.target1[layer];
          }
          stencil |= video.OBJWIN_MASK;
        }
        else {
          return;
        }
      }
      else if (video.windows[2].enabled[layer]) {
        video.setBlendEnabled(layer, video.windows[2].special && video.target1[layer], blend);
        if (video.windows[2].special && video.alphaEnabled) {
          mask |= video.target1[layer];
        }
      }
      else {
        return;
      }
    }

    if ((mask & video.TARGET1_MASK) && (oldStencil & video.TARGET2_MASK)) {
      video.setBlendEnabled(layer, true, 1);
    }

    var pixel = raw ? row : video.palette.accessColor(layer, index);

    if (mask & video.TARGET1_MASK) {
      video.setBlendEnabled(layer, !!blend, blend);
    }
    var highPriority = (mask & video.PRIORITY_MASK) < (oldStencil & video.PRIORITY_MASK);
    // Backgrounds can draw over each other, too.
    if ((mask & video.PRIORITY_MASK) == (oldStencil & video.PRIORITY_MASK)) {
      highPriority = !!(mask & video.BACKGROUND_MASK);
    }

    if (!(oldStencil & video.WRITTEN_MASK)) {
      // Nothing here yet, just continue
      stencil |= mask;
    }
    else if (highPriority) {
      // We are higher priority
      if (mask & video.TARGET1_MASK && oldStencil & video.TARGET2_MASK) {
        pixel = video.palette.mix(video.blendA, pixel, video.blendB, backing.color[offset]);
      }
      // We just drew over something, so it doesn't make sense for us to be a TARGET1 anymore...
      stencil |= mask & ~video.TARGET1_MASK;
    }
    else if ((mask & video.PRIORITY_MASK) > (oldStencil & video.PRIORITY_MASK)) {
      // We're below another layer, but might be the blend target for it
      stencil = oldStencil & ~(video.TARGET1_MASK | video.TARGET2_MASK);
      if (mask & video.TARGET2_MASK && oldStencil & video.TARGET1_MASK) {
        pixel = video.palette.mix(video.blendB, pixel, video.blendA, backing.color[offset]);
      }
      else {
        return;
      }
    }
    else {
      return;
    }

    if (mask & video.OBJWIN_MASK) {
      // We ARE the object window, don't draw pixels!
      backing.stencil[offset] |= video.OBJWIN_MASK;
      return;
    }
    backing.color[offset] = pixel;
    backing.stencil[offset] = stencil;
  }
  identity(x) {
    return x;
  }
  drawScanlineBlank(backing) {
    for (var x = 0; x < this.HORIZONTAL_PIXELS; ++x) {
      backing.color[x] = 0xFFFF;
      backing.stencil[x] = 0;
    }
  }
  prepareScanline(backing) {
    for (var x = 0; x < this.HORIZONTAL_PIXELS; ++x) {
      backing.stencil[x] = this.target2[this.LAYER_BACKDROP];
    }
  }
  drawScanlineBGMode0(backing, bg, start, end) {
    var video = this.video;
    var x;
    var y = video.vcount;
    var offset = start;
    var xOff = bg.x;
    var yOff = bg.y;
    var localX;
    var localXLo;
    var localY = y + yOff;
    if (this.mosaic) {
      localY -= y % video.bgMosaicY;
    }
    var localYLo = localY & 0x7;
    var mosaicX;
    var screenBase = bg.screenBase;
    var charBase = bg.charBase;
    var size = bg.size;
    var index = bg.index;
    var map = video.sharedMap;
    var paletteShift = bg.multipalette ? 1 : 0;
    var mask = video.target2[index] | (bg.priority << 1) | video.BACKGROUND_MASK;
    if (video.blendMode == 1 && video.alphaEnabled) {
      mask |= video.target1[index];
    }

    var yBase = (localY << 3) & 0x7C0;
    if (size == 2) {
      yBase += (localY << 3) & 0x800;
    }
    else if (size == 3) {
      yBase += (localY << 4) & 0x1000;
    }

    var xMask;
    if (size & 1) {
      xMask = 0x1FF;
    }
    else {
      xMask = 0xFF;
    }

    video.accessMapMode0(screenBase, size, (start + xOff) & xMask, yBase, map);
    var tileRow = video.accessTile(charBase, map.tile << paletteShift, (!map.vflip ? localYLo : 7 - localYLo) << paletteShift);
    for (x = start; x < end; ++x) {
      localX = (x + xOff) & xMask;
      mosaicX = this.mosaic ? offset % video.bgMosaicX : 0;
      localX -= mosaicX;
      localXLo = localX & 0x7;
      if (!paletteShift) {
        if (!localXLo || (this.mosaic && !mosaicX)) {
          video.accessMapMode0(screenBase, size, localX, yBase, map);
          tileRow = video.accessTile(charBase, map.tile, !map.vflip ? localYLo : 7 - localYLo);
          if (!tileRow && !localXLo) {
            x += 7;
            offset += 8;
            continue;
          }
        }
      }
      else {
        if (!localXLo || (this.mosaic && !mosaicX)) {
          video.accessMapMode0(screenBase, size, localX, yBase, map);
        }
        if (!(localXLo & 0x3) || (this.mosaic && !mosaicX)) {
          tileRow = video.accessTile(charBase + (!!(localX & 0x4) == !map.hflip ? 4 : 0), map.tile << 1, (!map.vflip ? localYLo : 7 - localYLo) << 1);
          if (!tileRow && !(localXLo & 0x3)) {
            x += 3;
            offset += 4;
            continue;
          }
        }
      }
      if (map.hflip) {
        localXLo = 7 - localXLo;
      }
      bg.pushPixel(index, map, video, tileRow, localXLo, offset, backing, mask, false);
      offset++;
    }
  }
  drawScanlineBGMode2(backing, bg, start, end) {
    var video = this.video;
    var x;
    var y = video.vcount;
    var offset = start;
    var localX;
    var localY;
    var screenBase = bg.screenBase;
    var charBase = bg.charBase;
    var size = bg.size;
    var sizeAdjusted = 128 << size;
    var index = bg.index;
    var map = video.sharedMap;
    var color;
    var mask = video.target2[index] | (bg.priority << 1) | video.BACKGROUND_MASK;
    if (video.blendMode == 1 && video.alphaEnabled) {
      mask |= video.target1[index];
    }

    var yBase;

    for (x = start; x < end; ++x) {
      localX = bg.dx * x + bg.sx;
      localY = bg.dy * x + bg.sy;
      if (this.mosaic) {
        localX -= (x % video.bgMosaicX) * bg.dx + (y % video.bgMosaicY) * bg.dmx;
        localY -= (x % video.bgMosaicX) * bg.dy + (y % video.bgMosaicY) * bg.dmy;
      }
      if (bg.overflow) {
        localX &= sizeAdjusted - 1;
        if (localX < 0) {
          localX += sizeAdjusted;
        }
        localY &= sizeAdjusted - 1;
        if (localY < 0) {
          localY += sizeAdjusted;
        }
      }
      else if (localX < 0 || localY < 0 || localX >= sizeAdjusted || localY >= sizeAdjusted) {
        offset++;
        continue;
      }
      yBase = ((localY << 1) & 0x7F0) << size;
      video.accessMapMode1(screenBase, size, localX, yBase, map);
      color = this.vram.loadU8(charBase + (map.tile << 6) + ((localY & 0x7) << 3) + (localX & 0x7));
      bg.pushPixel(index, map, video, color, 0, offset, backing, mask, false);
      offset++;
    }
  }
  drawScanlineBGMode3(backing, bg, start, end) {
    var video = this.video;
    var x;
    var y = video.vcount;
    var offset = start;
    var localX;
    var localY;
    var index = bg.index;
    var map = video.sharedMap;
    var color;
    var mask = video.target2[index] | (bg.priority << 1) | video.BACKGROUND_MASK;
    if (video.blendMode == 1 && video.alphaEnabled) {
      mask |= video.target1[index];
    }

    var yBase;

    for (x = start; x < end; ++x) {
      localX = bg.dx * x + bg.sx;
      localY = bg.dy * x + bg.sy;
      if (this.mosaic) {
        localX -= (x % video.bgMosaicX) * bg.dx + (y % video.bgMosaicY) * bg.dmx;
        localY -= (x % video.bgMosaicX) * bg.dy + (y % video.bgMosaicY) * bg.dmy;
      }
      if (localX < 0 || localY < 0 || localX >= video.HORIZONTAL_PIXELS || localY >= video.VERTICAL_PIXELS) {
        offset++;
        continue;
      }
      color = this.vram.loadU16(((localY * video.HORIZONTAL_PIXELS) + localX) << 1);
      bg.pushPixel(index, map, video, color, 0, offset, backing, mask, true);
      offset++;
    }
  }
  drawScanlineBGMode4(backing, bg, start, end) {
    var video = this.video;
    var x;
    var y = video.vcount;
    var offset = start;
    var localX;
    var localY;
    var charBase = 0;
    if (video.displayFrameSelect) {
      charBase += 0xA000;
    }
    var size = bg.size;
    var index = bg.index;
    var map = video.sharedMap;
    var color;
    var mask = video.target2[index] | (bg.priority << 1) | video.BACKGROUND_MASK;
    if (video.blendMode == 1 && video.alphaEnabled) {
      mask |= video.target1[index];
    }

    var yBase;

    for (x = start; x < end; ++x) {
      localX = bg.dx * x + bg.sx;
      localY = 0 | bg.dy * x + bg.sy;
      if (this.mosaic) {
        localX -= (x % video.bgMosaicX) * bg.dx + (y % video.bgMosaicY) * bg.dmx;
        localY -= (x % video.bgMosaicX) * bg.dy + (y % video.bgMosaicY) * bg.dmy;
      }
      yBase = (localY << 2) & 0x7E0;
      if (localX < 0 || localY < 0 || localX >= video.HORIZONTAL_PIXELS || localY >= video.VERTICAL_PIXELS) {
        offset++;
        continue;
      }
      color = this.vram.loadU8(charBase + (localY * video.HORIZONTAL_PIXELS) + localX);
      bg.pushPixel(index, map, video, color, 0, offset, backing, mask, false);
      offset++;
    }
  }
  drawScanlineBGMode5(backing, bg, start, end) {
    var video = this.video;
    var x;
    var y = video.vcount;
    var offset = start;
    var localX;
    var localY;
    var charBase = 0;
    if (video.displayFrameSelect) {
      charBase += 0xA000;
    }
    var index = bg.index;
    var map = video.sharedMap;
    var color;
    var mask = video.target2[index] | (bg.priority << 1) | video.BACKGROUND_MASK;
    if (video.blendMode == 1 && video.alphaEnabled) {
      mask |= video.target1[index];
    }

    var yBase;

    for (x = start; x < end; ++x) {
      localX = bg.dx * x + bg.sx;
      localY = bg.dy * x + bg.sy;
      if (this.mosaic) {
        localX -= (x % video.bgMosaicX) * bg.dx + (y % video.bgMosaicY) * bg.dmx;
        localY -= (x % video.bgMosaicX) * bg.dy + (y % video.bgMosaicY) * bg.dmy;
      }
      if (localX < 0 || localY < 0 || localX >= 160 || localY >= 128) {
        offset++;
        continue;
      }
      color = this.vram.loadU16(charBase + ((localY * 160) + localX) << 1);
      bg.pushPixel(index, map, video, color, 0, offset, backing, mask, true);
      offset++;
    }
  }
  drawScanline(y) {
    var backing = this.scanline;
    if (this.forcedBlank) {
      this.drawScanlineBlank(backing);
      return;
    }
    this.prepareScanline(backing);
    var layer;
    var firstStart;
    var firstEnd;
    var lastStart;
    var lastEnd;
    this.vcount = y;
    // Draw lower priority first and then draw over them
    for (var i = 0; i < this.drawLayers.length; ++i) {
      layer = this.drawLayers[i];
      if (!layer.enabled) {
        continue;
      }
      this.objwinActive = false;
      if (!(this.win0 || this.win1 || this.objwin)) {
        this.setBlendEnabled(layer.index, this.target1[layer.index], this.blendMode);
        layer.drawScanline(backing, layer, 0, this.HORIZONTAL_PIXELS);
      }
      else {
        firstStart = 0;
        firstEnd = this.HORIZONTAL_PIXELS;
        lastStart = 0;
        lastEnd = this.HORIZONTAL_PIXELS;
        if (this.win0 && y >= this.win0Top && y < this.win0Bottom) {
          if (this.windows[0].enabled[layer.index]) {
            this.setBlendEnabled(layer.index, this.windows[0].special && this.target1[layer.index], this.blendMode);
            layer.drawScanline(backing, layer, this.win0Left, this.win0Right);
          }
          firstStart = Math.max(firstStart, this.win0Left);
          firstEnd = Math.min(firstEnd, this.win0Left);
          lastStart = Math.max(lastStart, this.win0Right);
          lastEnd = Math.min(lastEnd, this.win0Right);
        }
        if (this.win1 && y >= this.win1Top && y < this.win1Bottom) {
          if (this.windows[1].enabled[layer.index]) {
            this.setBlendEnabled(layer.index, this.windows[1].special && this.target1[layer.index], this.blendMode);
            if (!this.windows[0].enabled[layer.index] && (this.win1Left < firstStart || this.win1Right < lastStart)) {
              // We've been cut in two by window 0!
              layer.drawScanline(backing, layer, this.win1Left, firstStart);
              layer.drawScanline(backing, layer, lastEnd, this.win1Right);
            }
            else {
              layer.drawScanline(backing, layer, this.win1Left, this.win1Right);
            }
          }
          firstStart = Math.max(firstStart, this.win1Left);
          firstEnd = Math.min(firstEnd, this.win1Left);
          lastStart = Math.max(lastStart, this.win1Right);
          lastEnd = Math.min(lastEnd, this.win1Right);
        }
        // Do last two
        if (this.windows[2].enabled[layer.index] || (this.objwin && this.windows[3].enabled[layer.index])) {
          // WINOUT/OBJWIN
          this.objwinActive = !!this.objwin;
          this.setBlendEnabled(layer.index, this.windows[2].special && this.target1[layer.index], this.blendMode); // Window 3 handled in pushPixel
          if (firstEnd > lastStart) {
            layer.drawScanline(backing, layer, 0, this.HORIZONTAL_PIXELS);
          }
          else {
            if (firstEnd) {
              layer.drawScanline(backing, layer, 0, firstEnd);
            }
            if (lastStart < this.HORIZONTAL_PIXELS) {
              layer.drawScanline(backing, layer, lastStart, this.HORIZONTAL_PIXELS);
            }
            if (lastEnd < firstStart) {
              layer.drawScanline(backing, layer, lastEnd, firstStart);
            }
          }
        }

        this.setBlendEnabled(this.LAYER_BACKDROP, this.target1[this.LAYER_BACKDROP] && this.windows[2].special, this.blendMode);
      }
      if (layer.bg) {
        layer.sx += layer.dmx;
        layer.sy += layer.dmy;
      }
    }

    this.finishScanline(backing);
  }
  finishScanline(backing) {
    var color;
    var bd = this.palette.accessColor(this.LAYER_BACKDROP, 0);
    var xx = this.vcount * this.HORIZONTAL_PIXELS * 4;
    var isTarget2 = this.target2[this.LAYER_BACKDROP];
    for (var x = 0; x < this.HORIZONTAL_PIXELS; ++x) {
      if (backing.stencil[x] & this.WRITTEN_MASK) {
        color = backing.color[x];
        if (isTarget2 && backing.stencil[x] & this.TARGET1_MASK) {
          color = this.palette.mix(this.blendA, color, this.blendB, bd);
        }
        this.palette.convert16To32(color, this.sharedColor);
      }
      else {
        this.palette.convert16To32(bd, this.sharedColor);
      }
      this.pixelData.data[xx++] = this.sharedColor[0];
      this.pixelData.data[xx++] = this.sharedColor[1];
      this.pixelData.data[xx++] = this.sharedColor[2];
      xx++;
    }
  }
  startDraw() {
    // Nothing to do
  }
  finishDraw(caller) {
    this.bg[2].sx = this.bg[2].refx;
    this.bg[2].sy = this.bg[2].refy;
    this.bg[3].sx = this.bg[3].refx;
    this.bg[3].sy = this.bg[3].refy;
    caller.finishDraw(this.pixelData);
  }
}