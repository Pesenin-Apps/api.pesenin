class Node {
  constructor(item, section) {
    this.order = {
      item,
      section
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
    const node = new Node(item, section);
    if (this.head == null) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
    return node;
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


// old linkedlist structure

// 'use strict';

// function createNode(item, section) {
//   return {
//     order: {
//       item,
//       section
//     },
//     next: null
//   }
// }

// function linkedList() {
//   return {
//     head: null,
//     tail: null,
//     length: 0,
//     push: function(item, section) {
//       const node = createNode(item, section);
//       // list null
//       if (this.head == null) {
//         this.head = node;
//         this.tail = node;
//       } else {
//         this.tail.next = node;
//         this.tail = node;
//       }
//       this.length++;
//       return node;
//     },
//     destroy: function(item) {
//       let current = this.head;
//       let previous;
//       if (current.order.item == item) {
//         this.head = current.next;
//       } else {
//         while (current) {
//           if (current.order.item == item) {
//             previous.next = current.next;
//           } else {
//             previous = current;
//           }
//           current = current.next;
//         }
//       }
//       this.length--;
//     },
//     print: function(section) {
//       const items = [];
//       let current = this.head;
//       while (current) {
//         if(current.order.section == section) {
//           items.push(current.order.item);
//         }
//         current = current.next;
//       }
//       return items;
//     },
//     count: function () {
//       return this.length;
//     }
//   }
// }

// const queue = linkedList();

// queue.push('615fdf3ddf0e734889c70f2d', 'grill');
// queue.push('615ff0219922e378ffe26e3b', 'soup');
// queue.push('615fd616e6c2143163cdcade', 'grill');
// queue.push('616033b625dc723e20e4c8cc', 'soup');
// queue.push('615ff0219922e378ffe26e3c', 'soup');
// queue.push('616033b625dc723e20e4c8cd', 'grill');

// // console.log(queue.print('grill'));
// // console.log(queue.print('soup'));

// console.log(queue.count());

// queue.destroy('616033b625dc723e20e4c8cc');
// console.log(queue.count());

// console.log(queue.print('soup'));

// queue.destroy('615fdf3ddf0e734889c70f2d');
// queue.destroy('616033b625dc723e20e4c8cd');
// console.log(queue.count());

// console.log(queue.print('grill'));

// module.exports = linkedList;