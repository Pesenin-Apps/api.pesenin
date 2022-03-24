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