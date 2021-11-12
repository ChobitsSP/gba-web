import MemoryView from "./MemoryView";

export default class SRAMSavedata extends MemoryView {
  writePending = false;
  constructor(size: number) {
    super(new ArrayBuffer(size), 0);
  }
  store8(offset: number, value: number) {
    this.view.setInt8(offset, value);
    this.writePending = true;
  }
  store16(offset: number, value: number) {
    this.view.setInt16(offset, value, true);
    this.writePending = true;
  }
  store32(offset: number, value: number) {
    this.view.setInt32(offset, value, true);
    this.writePending = true;
  }
}
