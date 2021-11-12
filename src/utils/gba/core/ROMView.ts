import MemoryView from "./MemoryView";

export default class ROMView extends MemoryView {
  gpio?: any;
  mmu?: any;

  constructor(rom, offset = 0) {
    super(rom, offset);
    this.ICACHE_PAGE_BITS = 10;
    this.PAGE_MASK = (2 << this.ICACHE_PAGE_BITS) - 1;
    this.icache = new Array(rom.byteLength >> (this.ICACHE_PAGE_BITS + 1));
    this.mask = 0x01ffffff;
    this.resetMask();
  }
  store8(offset, value) { }
  store16(offset, value) {
    if (offset < 0xca && offset >= 0xc4) {
      if (!this.gpio) {
        this.gpio = this.mmu.allocGPIO(this);
      }
      this.gpio.store16(offset, value);
    }
  }
  store32(offset, value) {
    if (offset < 0xca && offset >= 0xc4) {
      if (!this.gpio) {
        this.gpio = this.mmu.allocGPIO(this);
      }
      this.gpio.store32(offset, value);
    }
  }
}
