import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { CONFIG_OPTIONS } from '../amqp.constant';
import { AmqpRegisterConfigurationInterfaces, ConsumeMessageInterface, ContentMessageAmqp, SendMessageInterface } from '../amqp.interface';
import { ModulesContainer } from '@nestjs/core';
import { ConnectionService } from './connection.service';
import { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { HandlerService } from './handler.service';

@Injectable()
export class AmqpService implements OnModuleInit {
    private connection: amqp.AmqpConnectionManager;
    private register_config: AmqpRegisterConfigurationInterfaces
    private channel: amqp.ChannelWrapper
    private queueName : string
    constructor(
        @Inject(CONFIG_OPTIONS) private options: AmqpRegisterConfigurationInterfaces,
        private readonly connectionService: ConnectionService,
        private readonly handlerService: HandlerService,

    ) {
        this.queueName= this.options.queue.name
    }

    

    async sendMessage(data: SendMessageInterface) {
        const correlationId = uuidv4()
        const requestFib = new Promise(async (resolve) => {
            const { queue: replyTo } = await this.channel.assertQueue(data.queuName || this.queueName, {  });

            await this.channel.consume(replyTo, (message) => {
                if (!message) console.warn(' [x] Consumer cancelled');
                else if (message.properties.correlationId === correlationId) {
                    resolve(message.content.toString());
                }
            }, {});

            await this.channel.assertQueue(data.destQueue, {  });
            console.log(' [x] Requesting fib(%d)', data.payload);
            this.channel.sendToQueue(data.destQueue, new ContentMessageAmqp(data.payload, {
                correlationId,
                replyTo,
            }));

        });
        await requestFib

        return
    }


    async consumeMessage({ handler }: ConsumeMessageInterface) {
        await this.channel.assertQueue(this.queueName, { durable: false });

        await this.channel.consume(this.queueName, (message) => {
            console.log("got it : )")
            const n = parseInt(message.content.toString(), 10);
            console.log(' [.] fib(%d)', n);
            handler({}, {}, {})
            // const response = fib(n);
            // this.sendToQueue(message.properties.replyTo, Buffer.from(response.toString()), {
            //     correlationId: message.properties.correlationId
            // });
            this.channel.ack(message);
        });
        // await requestFib

        return
    }

    async onModuleInit() {
        await this.connectionService.connect()
        await this.connectionService.createChannel()
        this.channel = this.connectionService.channel
        
        const handlers = await this.handlerService.getHandlers("controllers")
        for (const handler of handlers) {
            await this.consumeMessage({ handler })
        }
    }

}