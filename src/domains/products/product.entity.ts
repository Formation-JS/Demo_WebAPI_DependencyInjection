
export class Product {

    constructor(
        id: string,
        name: string,
        price: number,
        stockQuantity: number,
        releaseDate: Date,
        isFood: boolean,
        tva: 'NORMAL' | 'INTERMEDIATE' | 'REDUCED' | 'ZERO',
        desc?: string,
        restockDate?: Date,
        ageRestriction?: '+3' | '+8' | '+12' | '+16' | '+18'
    ) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.releaseDate = releaseDate;
        this.isFood = isFood;
        this.tva = tva;
        this.desc = desc;
        this.restockDate = restockDate;
        this.ageRestriction = ageRestriction;
    }

    id: string;
    name: string;
    desc?: string;
    price: number;
    stockQuantity: number;
    releaseDate: Date;
    restockDate?: Date;
    isFood: boolean;
    tva: 'NORMAL' | 'INTERMEDIATE' | 'REDUCED' | 'ZERO';
    ageRestriction?: '+3' | '+8' | '+12' | '+16' | '+18';
}