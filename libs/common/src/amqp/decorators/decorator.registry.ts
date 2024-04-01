import { Injectable } from '@nestjs/common';
import { CREATE_CHANNEL } from '../amqp.constant';

@Injectable()
export class DecoratorRegistry {
    private decorators: Map<string, Set<Function>> = new Map();
    private test : number = 0
    addDecorator(key: string, decorator: any) {
        console.log(key)
        if (!this.decorators.has(key)) {
            this.decorators.set(key, new Set());
            this.test = this.test+1 
            console.log("set")
            console.log(this.getDecorators(CREATE_CHANNEL))
        }
        this.decorators.get(key).add(decorator);
    }

    getDecorators(key: string) {
        return this.test
    }
}