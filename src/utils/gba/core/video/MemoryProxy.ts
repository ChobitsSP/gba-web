import MemoryView from "../MemoryView";

export default class MemoryProxy {
  owner: any;
  blocks = [];
  blockSize: number;
  mask: number;
  size: number;

  constructor(owner, size: number, blockSize: number) {
    this.owner = owner;

    this.blockSize = blockSize;
    this.mask = (1 << blockSize) - 1;
    this.size = size;
    if (blockSize) {
      for (var i = 0; i < size >> blockSize; ++i) {
        this.blocks.push(new MemoryView(new ArrayBuffer(1 << blockSize)));
      }
    } else {
      this.blockSize = 31;
      this.mask = -1;
      this.blocks[0] = new MemoryView(new ArrayBuffer(size));
    }
  }
  combine() {
    if (this.blocks.length > 1) {
      var combined = new Uint8Array(this.size);
      for (var i = 0; i < this.blocks.length; ++i) {
        combined.set(
          new Uint8Array(this.blocks[i].buffer),
          i << this.blockSize
        );
      }
      return combined.buffer;
    } else {
      return this.blocks[0].buffer;
    }
  }
  replace(buffer) {
    for (var i = 0; i < this.blocks.length; ++i) {
      this.blocks[i] = new MemoryView(
        buffer.slice(
          i << this.blockSize,
          (i << this.blockSize) + this.blocks[i].buffer.byteLength
        )
      );
    }
  }
  load8(offset) {
    return this.blocks[offset >> this.blockSize].load8(offset & this.mask);
  }
  load16(offset) {
    return this.blocks[offset >> this.blockSize].load16(offset & this.mask);
  }
  loadU8(offset) {
    return this.blocks[offset >> this.blockSize].loadU8(offset & this.mask);
  }
  loadU16(offset) {
    return this.blocks[offset >> this.blockSize].loadU16(offset & this.mask);
  }
  load32(offset) {
    return this.blocks[offset >> this.blockSize].load32(offset & this.mask);
  }
  store8(offset, value) {
    if (offset >= this.size) {
      return;
    }
    this.owner.memoryDirtied(this, offset >> this.blockSize);
    this.blocks[offset >> this.blockSize].store8(offset & this.mask, value);
    this.blocks[offset >> this.blockSize].store8(
      (offset & this.mask) ^ 1,
      value
    );
  }
  store16(offset, value) {
    if (offset >= this.size) {
      return;
    }
    this.owner.memoryDirtied(this, offset >> this.blockSize);
    return this.blocks[offset >> this.blockSize].store16(
      offset & this.mask,
      value
    );
  }
  store32(offset, value) {
    if (offset >= this.size) {
      return;
    }
    this.owner.memoryDirtied(this, offset >> this.blockSize);
    return this.blocks[offset >> this.blockSize].store32(
      offset & this.mask,
      value
    );
  }
  invalidatePage(address) { }
}

