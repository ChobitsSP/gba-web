import MemoryView from "./MemoryView";

export default class FlashSavedata extends MemoryView {

  COMMAND_WIPE = 0x10;
  COMMAND_ERASE_SECTOR = 0x30;
  COMMAND_ERASE = 0x80;
  COMMAND_ID = 0x90;
  COMMAND_WRITE = 0xa0;
  COMMAND_SWITCH_BANK = 0xb0;
  COMMAND_TERMINATE_ID = 0xf0;

  ID_PANASONIC = 0x1b32;
  ID_SANYO = 0x1362;

  bank0: DataView;
  bank1: DataView;
  bank: DataView;

  idMode = false;
  writePending = false;

  first = 0;
  second = 0;
  command = 0;
  pendingCommand = 0;

  id: number;

  constructor(size: number) {
    super(new ArrayBuffer(size), 0);

    this.bank0 = new DataView(this.buffer, 0, 0x00010000);
    if (size > 0x00010000) {
      this.id = this.ID_SANYO;
      this.bank1 = new DataView(this.buffer, 0x00010000);
    } else {
      this.id = this.ID_PANASONIC;
      this.bank1 = null;
    }
    this.bank = this.bank0;
  }
  load8(offset) {
    if (this.idMode && offset < 2) {
      return (this.id >> (offset << 3)) & 0xff;
    } else if (offset < 0x10000) {
      return this.bank.getInt8(offset);
    } else {
      return 0;
    }
  }
  load16(offset) {
    return (this.load8(offset) & 0xff) | (this.load8(offset + 1) << 8);
  }
  load32(offset) {
    return (
      (this.load8(offset) & 0xff) |
      (this.load8(offset + 1) << 8) |
      (this.load8(offset + 2) << 16) |
      (this.load8(offset + 3) << 24)
    );
  }
  loadU8(offset) {
    return this.load8(offset) & 0xff;
  }
  loadU16(offset) {
    return (this.loadU8(offset) & 0xff) | (this.loadU8(offset + 1) << 8);
  }
  store8(offset, value) {
    switch (this.command) {
      case 0:
        if (offset == 0x5555) {
          if (this.second == 0x55) {
            switch (value) {
              case this.COMMAND_ERASE:
                this.pendingCommand = value;
                break;
              case this.COMMAND_ID:
                this.idMode = true;
                break;
              case this.COMMAND_TERMINATE_ID:
                this.idMode = false;
                break;
              default:
                this.command = value;
                break;
            }
            this.second = 0;
            this.first = 0;
          } else {
            this.command = 0;
            this.first = value;
            this.idMode = false;
          }
        } else if (offset == 0x2aaa && this.first == 0xaa) {
          this.first = 0;
          if (this.pendingCommand) {
            this.command = this.pendingCommand;
          } else {
            this.second = value;
          }
        }
        break;
      case this.COMMAND_ERASE:
        switch (value) {
          case this.COMMAND_WIPE:
            if (offset == 0x5555) {
              for (let i = 0; i < this.view.byteLength; i += 4) {
                this.view.setInt32(i, -1);
              }
            }
            break;
          case this.COMMAND_ERASE_SECTOR:
            if ((offset & 0x0fff) == 0) {
              for (let i = offset; i < offset + 0x1000; i += 4) {
                this.bank.setInt32(i, -1);
              }
            }
            break;
        }
        this.pendingCommand = 0;
        this.command = 0;
        break;
      case this.COMMAND_WRITE:
        this.bank.setInt8(offset, value);
        this.command = 0;

        this.writePending = true;
        break;
      case this.COMMAND_SWITCH_BANK:
        if (this.bank1 && offset == 0) {
          if (value == 1) {
            this.bank = this.bank1;
          } else {
            this.bank = this.bank0;
          }
        }
        this.command = 0;
        break;
    }
  }
  store16(offset, value) {
    throw new Error('Unaligned save to flash!');
  }
  store32(offset, value) {
    throw new Error('Unaligned save to flash!');
  }
  replaceData(memory: ArrayBuffer) {
    var bank = this.view === this.bank1;
    MemoryView.prototype.replaceData.call(this, memory, 0);

    this.bank0 = new DataView(this.buffer, 0, 0x00010000);
    if (memory.byteLength > 0x00010000) {
      this.bank1 = new DataView(this.buffer, 0x00010000);
    } else {
      this.bank1 = null;
    }
    this.bank = bank ? this.bank1 : this.bank0;
  }
}