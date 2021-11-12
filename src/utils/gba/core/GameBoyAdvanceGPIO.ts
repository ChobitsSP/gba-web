import GameBoyAdvanceRTC from "./GameBoyAdvanceRTC";

export default class GameBoyAdvanceGPIO {
  core: any;
  rom: any;
  readWrite = 0;
  direction = 0;
  device: GameBoyAdvanceRTC;

  constructor(core, rom) {
    this.core = core;
    this.rom = rom;
    this.device = new GameBoyAdvanceRTC(this); // TODO: Support more devices
  }

  store16(offset, value) {
    switch (offset) {
      case 0xc4:
        this.device.setPins(value & 0xf);
        break;
      case 0xc6:
        this.direction = value & 0xf;
        this.device.setDirection(this.direction);
        break;
      case 0xc8:
        this.readWrite = value & 1;
        break;
      default:
        throw new Error(
          'BUG: Bad offset passed to GPIO: ' + offset.toString(16)
        );
    }
    if (this.readWrite) {
      var old = this.rom.view.getUint16(offset, true);
      old &= ~this.direction;
      this.rom.view.setUint16(offset, old | (value & this.direction), true);
    }
  }
  outputPins(nybble) {
    if (this.readWrite) {
      var old = this.rom.view.getUint16(0xc4, true);
      old &= this.direction;
      this.rom.view.setUint16(
        0xc4,
        old | (nybble & ~this.direction & 0xf),
        true
      );
    }
  }
}
