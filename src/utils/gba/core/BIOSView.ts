import MemoryView from "./MemoryView";

export default class BIOSView extends MemoryView {
  constructor(rom, offset = 0) {
    super(rom, offset);

    this.ICACHE_PAGE_BITS = 16;
    this.PAGE_MASK = (2 << this.ICACHE_PAGE_BITS) - 1;
    this.icache = new Array(1);
  }
  load8(offset) {
    if (offset >= this.buffer.byteLength) {
      return -1;
    }
    return this.view.getInt8(offset);
  }
  load16(offset) {
    if (offset >= this.buffer.byteLength) {
      return -1;
    }
    return this.view.getInt16(offset, true);
  }
  loadU8(offset) {
    if (offset >= this.buffer.byteLength) {
      return -1;
    }
    return this.view.getUint8(offset);
  }
  loadU16(offset) {
    if (offset >= this.buffer.byteLength) {
      return -1;
    }
    return this.view.getUint16(offset, true);
  }
  load32(offset) {
    if (offset >= this.buffer.byteLength) {
      return -1;
    }
    return this.view.getInt32(offset, true);
  }
  store8(offset, value) { }
  store16(offset, value) { }
  store32(offset, value) { }
}
