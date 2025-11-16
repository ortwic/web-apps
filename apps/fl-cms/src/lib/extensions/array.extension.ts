declare global {
  interface Array<T> {
    contains(item: T): boolean;
    insert(item: T, index: number): boolean;
    swap(fromIndex: number, toIndex: number): boolean;
    remove(index: number): boolean;
  }
}

Array.prototype.contains = function <T>(item: T) {
    const unique = JSON.stringify(item);
    return this.some((e) => JSON.stringify(e) === unique);
};

Array.prototype.insert = function <T>(item: T, index: number) {
    if (index > -1 && index < this.length) {
        this.splice(index, 0, item);
        return true;
    }
    
    this.unshift(item);
    return true;
};

Array.prototype.remove = function (index: number) {
  if (index > -1 && index < this.length) {
    this.splice(index, 1);
    return true;
  }
  return false;
};

Array.prototype.swap = function (from: number, to: number) {
  if (to !== from) {
    const start = from < 0 ? this.length + from : from;
    const end = to < 0 ? this.length + to : to;

    // stable implementation since it doesn't affect the current index
    const temp = this[start];
    this[start] = this[end];
    this[end] = temp;
    return true;
  }
  return false;
};
