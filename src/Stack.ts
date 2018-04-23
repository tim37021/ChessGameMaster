export class Stack<T> {
    private store: T[] = [];

    public isEmpty(): boolean {
        return this.store.length === 0;
    }

    public push(val: T): void {
        this.store.push(val);
    }

    public pop(): T {
        return this.store.pop();
    }
}
