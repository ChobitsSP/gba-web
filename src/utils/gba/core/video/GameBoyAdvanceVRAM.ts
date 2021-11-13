import MemoryAligned16 from "./MemoryAligned16"

export default class GameBoyAdvanceVRAM extends MemoryAligned16 {
  vram: Uint16Array;
  constructor(size) {
    super(size);
    this.vram = this.buffer;
  }
}
