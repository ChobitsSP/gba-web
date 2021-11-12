export default class MemoryView {
  buffer: ArrayBuffer;
  view: DataView;
  mask: number;
  mask8: number;
  mask16: number;
  mask32: number;
  icache?: any[];
  ICACHE_PAGE_BITS?: any;
  PAGE_MASK?: any;

  constructor(memory, offset = 0) {
    // this.inherit();
    this.buffer = memory;
    this.view = new DataView(
      this.buffer,
      typeof offset === 'number' ? offset : 0
    );
    this.mask = memory.byteLength - 1;
    this.resetMask();
  }
  resetMask() {
    this.mask8 = this.mask & 0xffffffff;
    this.mask16 = this.mask & 0xfffffffe;
    this.mask32 = this.mask & 0xfffffffc;
  }
  load8(offset: number) {
    return this.view.getInt8(offset & this.mask8);
  }
  load16(offset: number) {
    // Unaligned 16-bit loads are unpredictable...let's just pretend they work
    return this.view.getInt16(offset & this.mask, true);
  }
  loadU8(offset: number) {
    return this.view.getUint8(offset & this.mask8);
  }
  loadU16(offset: number) {
    // Unaligned 16-bit loads are unpredictable...let's just pretend they work
    return this.view.getUint16(offset & this.mask, true);
  }
  load32(offset: number) {
    // Unaligned 32-bit loads are "rotated" so they make some semblance of sense
    var rotate = (offset & 3) << 3;
    var mem = this.view.getInt32(offset & this.mask32, true);
    return (mem >>> rotate) | (mem << (32 - rotate));
  }
  store8(offset: number, value: number) {
    this.view.setInt8(offset & this.mask8, value);
  }
  store16(offset: number, value: number) {
    this.view.setInt16(offset & this.mask16, value, true);
  }
  store32(offset: number, value: number) {
    this.view.setInt32(offset & this.mask32, value, true);
  }
  invalidatePage(address) { }
  replaceData(memory: ArrayBuffer, offset: number) {
    this.buffer = memory;
    this.view = new DataView(
      this.buffer,
      typeof offset === 'number' ? offset : 0
    );
    if (this.icache) {
      this.icache = new Array(this.icache.length);
    }
  }
}
