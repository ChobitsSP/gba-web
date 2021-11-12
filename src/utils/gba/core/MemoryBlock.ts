import MemoryView from "./MemoryView";

export default class MemoryBlock extends MemoryView {
  constructor(size: number, cacheBits) {
    super(new ArrayBuffer(size));
    this.ICACHE_PAGE_BITS = cacheBits;
    this.PAGE_MASK = (2 << this.ICACHE_PAGE_BITS) - 1;
    this.icache = new Array(size >> (this.ICACHE_PAGE_BITS + 1));
  }
  invalidatePage(address) {
    var page = this.icache[(address & this.mask) >> this.ICACHE_PAGE_BITS];
    if (page) {
      page.invalid = true;
    }
  }
}
