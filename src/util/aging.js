module.exports = class AgingQueue {

    constructor(maxCapacity) {
        this.maxCapacity = maxCapacity;
        this.offsetNumber = 0;
        this.queue = [];
    }

    push(obj) {
        this.queue.push(obj);
        while (this.queue.length > this.maxCapacity) {
            this.queue.shift();
            this.offsetNumber++;
        }
        obj.id = this.offsetNumber + this.queue.length - 1;
    }

    get(id) {
        let obj = this.queue[id - this.offsetNumber];
        return obj;
    }

    slice(id) {
        if (id >= 0) {
            return this.queue.slice(Math.max(0, id - this.offsetNumber));
        } else {
            return this.queue.slice(id);
        }
    }

    all() {
        return this.slice(0);
    }
}