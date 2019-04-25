type Extended<T> = T & { id?: number };

export default class AgingQueue<T> {
    offsetNumber = 0;
    queue: Extended<T>[] = [];

    constructor(private maxCapacity: number) {}

    push(obj: Extended<T>) {
        this.queue.push(obj);
        while (this.queue.length > this.maxCapacity) {
            this.queue.shift();
            this.offsetNumber++;
        }
        obj.id = this.offsetNumber + this.queue.length - 1;
    }

    get(id: number): Extended<T> {
        let obj = this.queue[id - this.offsetNumber];
        return obj;
    }

    slice(id: number): Extended<T>[] {
        if (id >= 0) {
            return this.queue.slice(Math.max(0, id - this.offsetNumber));
        } else {
            return this.queue.slice(id);
        }
    }

    all(): Extended<T>[] {
        return this.slice(0);
    }
}