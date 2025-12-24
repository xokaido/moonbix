import { Item } from './Item';

export class ItemSpawner {
    items: Item[] = [];
    screenWidth: number;
    screenHeight: number;

    constructor(width: number, height: number) {
        this.screenWidth = width;
        this.screenHeight = height;
    }

    spawnItems(count: number = 10) {
        this.items = [];
        for (let i = 0; i < count; i++) {
            // Random type: 70% food, 30% burnt
            const type = Math.random() > 0.3 ? 'food' : 'burnt';

            // Random position in bottom 60% of screen
            // Avoid edges
            const margin = 50;
            const x = margin + Math.random() * (this.screenWidth - margin * 2);
            const y = this.screenHeight * 0.4 + Math.random() * (this.screenHeight * 0.6 - margin);

            // Basic overlap check (could be improved)
            let overlapping = false;
            for (const item of this.items) {
                const dx = x - item.x;
                const dy = y - item.y;
                if (Math.sqrt(dx * dx + dy * dy) < 60) {
                    overlapping = true;
                    break;
                }
            }

            if (!overlapping) {
                this.items.push(new Item(x, y, type));
            } else {
                i--; // Retry
            }
        }
    }

    update(dt: number) {
        for (const item of this.items) {
            item.update(dt);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.items.forEach(item => item.draw(ctx));
    }
}
