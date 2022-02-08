class Node {
  constructor(item, section) {
    this.order = {
      item,
      section,
    },
    this.next = null
  }
}

class LinkedList {

  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  push(item, section) {
    let current;
    const node = new Node(item, section);
    if (this.head == null) {
      this.head = node;
    } else {
      current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = node;
    }
    this.length++;
  }

  destroy(item) {
    let current = this.head;
    let previous;
    if (current.order.item == item) {
      this.head = current.next;
    } else {
      while (current) {
        if (current.order.item == item) {
          previous.next = current.next;
        } else {
          previous = current;
        }
        current = current.next;
      }
    }
    this.length--;
  }

  list() {
    let str = "";
    let current = this.head;
    while (current) {
      str += current.order.item + (current.next ? "#space#" : "");
      current = current.next;
    }
    return str.split('#space#');
  }

  print(section) {
    const items = [];
    let current = this.head;
    while (current) {
      if(current.order.section == section) {
        items.push(current.order.item);
      }
      current = current.next;
    }
    return items;
  }

  count() {
    return this.length;
  }

}

module.exports = LinkedList;

// const queue = new LinkedList();

// queue.push('ikan bakar putih', 'pembakaran');
// queue.push('cah pakis', 'sayuran');
// queue.push('ikan bakar baronang', 'pembakaran');
// queue.push('cah kangkung', 'sayuran');
// queue.push('terong tumis', 'sayuran');
// queue.push('cumi bakar', 'pembakaran');

// console.log(queue.list());

// console.log(queue.print('pembakaran'));
// console.log(queue.print('sayuran'));

// console.log(queue.count());

// queue.destroy('terong tumis');
// console.log('terong tumis');
// console.log(queue.count());

// console.log(queue.print('sayuran'));

// queue.destroy('ikan bakar putih');
// console.log('ikan bakar putih');
// queue.destroy('cumi bakar');
// console.log('cumi bakar');
// console.log(queue.count());

// queue.push('kepiting bakar', 'pembakaran');
// console.log(queue.count());

// queue.push('cah toge', 'sayuran');
// console.log(queue.count());

// console.log(queue.print('pembakaran'));
// console.log(queue.print('sayuran'));

// console.log(queue.list());