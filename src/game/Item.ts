export type ItemType = 'food' | 'burnt';

export class Item {
    x: number;
    y: number;
    radius: number = 25;
    type: ItemType;
    value: number;
    emoji: string;
    caught: boolean = false;

    constructor(x: number, y: number, type: ItemType) {
        this.x = x;
        this.y = y;
        this.type = type;

        if (type === 'food') {
            this.value = 10;
            const foods = ['🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🍫'];
            this.emoji = foods[Math.floor(Math.random() * foods.length)];
        } else {
            this.value = -5;
            const burnt = ['🔥', '💀', '💩', '🧛'];
            this.emoji = burnt[Math.floor(Math.random() * burnt.length)];
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.caught) return;

        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);

        // Debug circle
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // ctx.strokeStyle = 'red';
        // ctx.stroke();
    }
}
