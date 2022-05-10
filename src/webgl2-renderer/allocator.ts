export class Allocator {
    readonly #allocated: boolean[] = [];

    alloc() {
        const array = this.#allocated;
        let i = 0;
        for (; i < array.length; i++) {
            if (!array[i])
                break;
        }
        array[i] = true;
        return i;
    }

    free(index: number) {
        const array = this.#allocated;
        console.assert(array[index]);
        delete array[index];
    }
}

