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
  }

  push(item, section) {
    let current = this.head;
    const node = new Node(item, section);
    if (current == null) {
      this.head = node;
    } else {
      while (current.next) {
        current = current.next;
      }
      current.next = node;
    }
  }

  destroy(item) {
    let current = this.head, previous;
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
  }

  list() {
    let current = this.head, str = "";
    while (current) {
      str += current.order.item + (current.next ? "#space#" : "");
      current = current.next;
    }
    return str.split('#space#');
  }

  print(section) {
    let current = this.head, items = [];
    while (current) {
      if(current.order.section == section) {
        items.push(current.order.item);
      }
      current = current.next;
    }
    return items;
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
