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
            // Random type: 65% food, 25% burnt, 5% enhancer, 5% reducer
            const rand = Math.random();
            let type: any = 'food';

            if (rand < 0.05) {
                type = 'timer_enhancer';
            } else if (rand < 0.10) {
                type = 'timer_reducer';
            } else if (rand < 0.35) {
                type = 'burnt';
            } else {
                type = 'food';
            }

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
