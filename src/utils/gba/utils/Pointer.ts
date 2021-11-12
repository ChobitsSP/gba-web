export default class Pointer {
  index = 0;
  top = 0;
  stack: number[] = [];

  advance(amount: number) {
    var index = this.index;
    this.index += amount;
    return index;
  }
  mark() {
    return this.index - this.top;
  }
  push() {
    this.stack.push(this.top);
    this.top = this.index;
  }
  pop() {
    this.top = this.stack.pop();
  }
  readString(view) {
    var length = view.getUint32(this.advance(4), true);
    var bytes = [];
    for (var i = 0; i < length; ++i) {
      bytes.push(String.fromCharCode(view.getUint8(this.advance(1))));
    }
    return bytes.join("");
  }
}
