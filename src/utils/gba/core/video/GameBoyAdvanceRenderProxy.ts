
import MemoryProxy from "./MemoryProxy";
import Serializer from "../../utils/Serializer";

export default class GameBoyAdvanceRenderProxy {
  worker: Worker;

  currentFrame = 0;
  delay = 0;
  skipFrame = false;
  dirty = null;

  backing: any;
  caller: any;

  palette: MemoryProxy;
  vram: MemoryProxy;
  oam: MemoryProxy;

  scanlineQueue?: any[];

  constructor() {
    this.worker = new Worker('js/video/worker.js');

    this.currentFrame = 0;
    this.delay = 0;
    this.skipFrame = false;

    this.dirty = null;
    var self = this;
    var handlers = {
      finish: function (data) {
        self.backing = data.backing;
        self.caller.finishDraw(self.backing);
        --self.delay;
      },
    };
    this.worker.onmessage = function (message) {
      handlers[message.data['type']](message.data);
    };
  }
  memoryDirtied(mem, block) {
    this.dirty = this.dirty || {};
    this.dirty.memory = this.dirty.memory || {};
    if (mem === this.palette) {
      this.dirty.memory.palette = mem.blocks[0].buffer;
    }
    if (mem === this.oam) {
      this.dirty.memory.oam = mem.blocks[0].buffer;
    }
    if (mem === this.vram) {
      this.dirty.memory.vram = this.dirty.memory.vram || [];
      this.dirty.memory.vram[block] = mem.blocks[block].buffer;
    }
  }
  clear(mmu) {
    this.palette = new MemoryProxy(this, mmu.SIZE_PALETTE_RAM, 0);
    this.vram = new MemoryProxy(this, mmu.SIZE_VRAM, 13);
    this.oam = new MemoryProxy(this, mmu.SIZE_OAM, 0);

    this.dirty = null;
    this.scanlineQueue = [];

    this.worker.postMessage({
      type: 'clear',
      SIZE_VRAM: mmu.SIZE_VRAM,
      SIZE_OAM: mmu.SIZE_OAM,
    });
  }
  freeze(encodeBase64) {
    return {
      palette: Serializer.prefix(this.palette.combine()),
      vram: Serializer.prefix(this.vram.combine()),
      oam: Serializer.prefix(this.oam.combine()),
    };
  }
  defrost(frost, decodeBase64) {
    this.palette.replace(frost.palette);
    this.memoryDirtied(this.palette, 0);
    this.vram.replace(frost.vram);
    for (var i = 0; i < this.vram.blocks.length; ++i) {
      this.memoryDirtied(this.vram, i);
    }
    this.oam.replace(frost.oam);
    this.memoryDirtied(this.oam, 0);
  }
  writeDisplayControl(value) {
    this.dirty = this.dirty || {};
    this.dirty.DISPCNT = value;
  }
  writeBackgroundControl(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGCNT = this.dirty.BGCNT || [];
    this.dirty.BGCNT[bg] = value;
  }
  writeBackgroundHOffset(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGHOFS = this.dirty.BGHOFS || [];
    this.dirty.BGHOFS[bg] = value;
  }
  writeBackgroundVOffset(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGVOFS = this.dirty.BGVOFS || [];
    this.dirty.BGVOFS[bg] = value;
  }
  writeBackgroundRefX(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGX = this.dirty.BGX || [];
    this.dirty.BGX[bg] = value;
  }
  writeBackgroundRefY(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGY = this.dirty.BGY || [];
    this.dirty.BGY[bg] = value;
  }
  writeBackgroundParamA(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGPA = this.dirty.BGPA || [];
    this.dirty.BGPA[bg] = value;
  }
  writeBackgroundParamB(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGPB = this.dirty.BGPB || [];
    this.dirty.BGPB[bg] = value;
  }
  writeBackgroundParamC(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGPC = this.dirty.BGPC || [];
    this.dirty.BGPC[bg] = value;
  }
  writeBackgroundParamD(bg, value) {
    this.dirty = this.dirty || {};
    this.dirty.BGPD = this.dirty.BGPD || [];
    this.dirty.BGPD[bg] = value;
  }
  writeWin0H(value) {
    this.dirty = this.dirty || {};
    this.dirty.WIN0H = value;
  }
  writeWin1H(value) {
    this.dirty = this.dirty || {};
    this.dirty.WIN1H = value;
  }
  writeWin0V(value) {
    this.dirty = this.dirty || {};
    this.dirty.WIN0V = value;
  }
  writeWin1V(value) {
    this.dirty = this.dirty || {};
    this.dirty.WIN1V = value;
  }
  writeWinIn(value) {
    this.dirty = this.dirty || {};
    this.dirty.WININ = value;
  }
  writeWinOut(value) {
    this.dirty = this.dirty || {};
    this.dirty.WINOUT = value;
  }
  writeBlendControl(value) {
    this.dirty = this.dirty || {};
    this.dirty.BLDCNT = value;
  }
  writeBlendAlpha(value) {
    this.dirty = this.dirty || {};
    this.dirty.BLDALPHA = value;
  }
  writeBlendY(value) {
    this.dirty = this.dirty || {};
    this.dirty.BLDY = value;
  }
  writeMosaic(value) {
    this.dirty = this.dirty || {};
    this.dirty.MOSAIC = value;
  }
  clearSubsets(mmu, regions) {
    this.dirty = this.dirty || {};
    if (regions & 0x04) {
      this.palette = new MemoryProxy(this, mmu.SIZE_PALETTE_RAM, 0);
      mmu.mmap(mmu.REGION_PALETTE_RAM, this.palette);
      this.memoryDirtied(this.palette, 0);
    }
    if (regions & 0x08) {
      this.vram = new MemoryProxy(this, mmu.SIZE_VRAM, 13);
      mmu.mmap(mmu.REGION_VRAM, this.vram);
      for (var i = 0; i < this.vram.blocks.length; ++i) {
        this.memoryDirtied(this.vram, i);
      }
    }
    if (regions & 0x10) {
      this.oam = new MemoryProxy(this, mmu.SIZE_OAM, 0);
      mmu.mmap(mmu.REGION_OAM, this.oam);
      this.memoryDirtied(this.oam, 0);
    }
  }
  setBacking(backing) {
    this.backing = backing;
    this.worker.postMessage({ type: 'start', backing: this.backing });
  }
  drawScanline(y) {
    if (!this.skipFrame) {
      if (this.dirty) {
        if (this.dirty.memory) {
          if (this.dirty.memory.palette) {
            this.dirty.memory.palette = this.dirty.memory.palette.slice(0);
          }
          if (this.dirty.memory.oam) {
            this.dirty.memory.oam = this.dirty.memory.oam.slice(0);
          }
          if (this.dirty.memory.vram) {
            for (var i = 0; i < 12; ++i) {
              if (this.dirty.memory.vram[i]) {
                this.dirty.memory.vram[i] = this.dirty.memory.vram[i].slice(0);
              }
            }
          }
        }
        this.scanlineQueue.push({ y: y, dirty: this.dirty });
        this.dirty = null;
      }
    }
  }
  startDraw() {
    ++this.currentFrame;
    if (this.delay <= 0) {
      this.skipFrame = false;
    }
    if (!this.skipFrame) {
      ++this.delay;
    }
  }
  finishDraw(caller) {
    this.caller = caller;
    if (!this.skipFrame) {
      this.worker.postMessage({
        type: 'finish',
        scanlines: this.scanlineQueue,
        frame: this.currentFrame,
      });
      this.scanlineQueue = [];
      if (this.delay > 2) {
        this.skipFrame = true;
      }
    }
  }
}
