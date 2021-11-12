export default class BadMemory {
  cpu?: any;
  mmu?: any;

  constructor(mmu, cpu) {
    // this.inherit();
    this.cpu = cpu;
    this.mmu = mmu;
  }
  load8(offset) {
    return this.mmu.load8(
      this.cpu.gprs[this.cpu.PC] - this.cpu.instructionWidth + (offset & 0x3)
    );
  }
  load16(offset) {
    return this.mmu.load16(
      this.cpu.gprs[this.cpu.PC] - this.cpu.instructionWidth + (offset & 0x2)
    );
  }
  loadU8(offset) {
    return this.mmu.loadU8(
      this.cpu.gprs[this.cpu.PC] - this.cpu.instructionWidth + (offset & 0x3)
    );
  }
  loadU16(offset) {
    return this.mmu.loadU16(
      this.cpu.gprs[this.cpu.PC] - this.cpu.instructionWidth + (offset & 0x2)
    );
  }
  load32(offset) {
    if (this.cpu.execMode == this.cpu.MODE_ARM) {
      return this.mmu.load32(
        this.cpu.gprs[this.cpu.gprs.PC] - this.cpu.instructionWidth
      );
    } else {
      var halfword = this.mmu.loadU16(
        this.cpu.gprs[this.cpu.PC] - this.cpu.instructionWidth
      );
      return halfword | (halfword << 16);
    }
  }
  store8(offset, value) { }
  store16(offset, value) { }
  store32(offset, value) { }
  invalidatePage(address) { }
}
