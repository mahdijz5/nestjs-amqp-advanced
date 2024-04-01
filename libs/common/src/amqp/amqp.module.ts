import { Module, OnModuleInit, Scope, Type } from '@nestjs/common';
import { AmqpService } from './amqp.service';

import { MetadataScanner, ModulesContainer, Reflector } from '@nestjs/core';
 


@Module({
    imports: [],
    controllers: [],
    providers: [AmqpService,MetadataScanner],
})
export class AmqpModule implements OnModuleInit {
    private queueName: string;
 
    constructor(
        private readonly amqpService: AmqpService,
        private reflector: Reflector,
  

    ) {

    }

    setQueueName(queueName: string) {
        this.queueName = queueName;
    }

    async createChannel() {
        const connection = await this.amqpService.connect();
        const channel = await connection.createChannel();
        await channel.assertQueue(this.queueName);
        return channel;
    }
 
 
    
    async onModuleInit() {
      
        await this.createChannel()
        return
    }




}
