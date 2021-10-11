function createNode(item, section) {
  return {
    order: {
      item,
      section
    },
    next: null
  }
}


function linkedList() {
  return {
    head: null,
    tail: null,
    length: 0,
    push: function(item, section) {
      const node = createNode(item, section);
      if (this.head == null) {
        this.head = node;
        this.tail = node;
      } else {
        this.tail.next = node;
        this.tail = node;
      }
      this.length++;
      return node;
    },
    print: function(section) {
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
  }
}

// const queue = linkedList();

// queue.push('615fdf3ddf0e734889c70f2d', 'grill');
// queue.push('615ff0219922e378ffe26e3b', 'soup');
// queue.push('615fd616e6c2143163cdcade', 'grill');
// queue.push('616033b625dc723e20e4c8cc', 'soup');
// queue.push('615ff0219922e378ffe26e3c', 'soup');
// queue.push('616033b625dc723e20e4c8cd', 'grill');

// console.log(queue.print('60d33a97d31e1a2a58076606'));

module.exports = linkedList;