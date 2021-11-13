export default class MemoryAligned16 {
  buffer: Uint16Array;
  constructor(size: number) {
    this.buffer = new Uint16Array(size >> 1);
  }
  load8(offset) {
    return (this.loadU8(offset) << 24) >> 24;
  }
  load16(offset) {
    return (this.loadU16(offset) << 16) >> 16;
  }
  loadU8(offset) {
    var index = offset >> 1;
    if (offset & 1) {
      return (this.buffer[index] & 0xFF00) >>> 8;
    }
    else {
      return this.buffer[index] & 0x00FF;
    }
  }
  loadU16(offset) {
    return this.buffer[offset >> 1];
  }
  load32(offset) {
    return this.buffer[(offset >> 1) & ~1] | (this.buffer[(offset >> 1) | 1] << 16);
  }
  store8(offset, value) {
    var index = offset >> 1;
    this.store16(offset, (value << 8) | value);
  }
  store16(offset, value) {
    this.buffer[offset >> 1] = value;
  }
  store32(offset, value) {
    var index = offset >> 1;
    this.store16(offset, this.buffer[index] = value & 0xFFFF);
    this.store16(offset + 2, this.buffer[index + 1] = value >>> 16);
  }
  insert(start, data) {
    this.buffer.set(data, start);
  }
  invalidatePage(address) { }
};
