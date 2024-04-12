import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { CONFIG_OPTIONS } from '../amqp.constant';
import { AmqpRegisterConfigurationInterfaces, ConsumeMessageInterface, ContentMessageAmqp, MessageProperties, SendMessageInterfaceOptions } from '../amqp.interface';
import { ModulesContainer } from '@nestjs/core';
import { ConnectionService } from './connection.service';
import { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { HandlerService } from './handler.service';
import { _default_configs } from '../configs/default.configs';
import { subscribe } from 'diagnostics_channel';

@Injectable()
export class AmqpService implements OnModuleInit {
    private _default_configs: AmqpRegisterConfigurationInterfaces
    private _registered_configs: AmqpRegisterConfigurationInterfaces
    private _configs: AmqpRegisterConfigurationInterfaces
    private deserializer: (message: any) => any
    private serializer: (value: any) => any

    private channel: amqp.ChannelWrapper
    private queueName: string
    constructor(
        @Inject(CONFIG_OPTIONS) private options: AmqpRegisterConfigurationInterfaces,
        private readonly connectionService: ConnectionService,
        private readonly handlerService: HandlerService,

    ) {
        this.deserializer = (message) => JSON.parse(message.toString())
        this.serializer = (value) => Buffer.from(JSON.stringify(value))
        this._default_configs = _default_configs
        this._registered_configs = this.options
        this._configs = { ...this._default_configs, ...this._registered_configs }
        this.queueName = this.options.queue.name
    }



    async sendMessage(toQueue: string, payload: any, data: SendMessageInterfaceOptions) {
        let replyTo = data.queuName || this.queueName
        const { queue } = await this.channel.assertQueue(data.queuName || this.queueName, {});
        let correlationId: string
        correlationId = uuidv4()
        let num = 1
        const requestFib = new Promise(async (resolve) => {
            if (data.subscribe) {

                const consumer = await this.channel.consume(replyTo, (message) => {
                    this.channel.ack(message)
                    if (!message) console.warn('[x] Consumer cancelled');
                    else if (message.properties.correlationId === correlationId) {
                        resolve(this.deserializer(message.content));
                        this.channel.cancel(consumer.consumerTag)

                    }
                }, {})

            }


            const BufferedPayload = this.serializer(new ContentMessageAmqp(payload, {

            }))
            this.channel.sendToQueue(toQueue, BufferedPayload, <MessageProperties>{
                correlationId: subscribe ? correlationId : null,
                replyTo,
            })

        });

        return await requestFib
    }


    async consumeMessage({ handler }: ConsumeMessageInterface) {
        const { queue } = await this.channel.assertQueue(this.queueName, {});
        console.log(queue)
        await this.channel.consume(queue, async (message) => {
            const replyTo = message.properties.replyTo
            const correlationId = message.properties.correlationId
            console.log(message)
            console.log("got it : )")
            const res = await handler({ ...this.deserializer(message.content) }, {}, {})

            if (correlationId) {
                this.channel.sendToQueue(replyTo, this.serializer(res), <MessageProperties>{
                    correlationId
                });
            }
            this.channel.ack(message);
        });
        // await requestFib

        return
    }

    async onModuleInit() {
        await this.connectionService.connect()
        this.channel = await this.connectionService.createChannel()
        const exchnage_config = this._configs.exchnage
        const queue_config = this._configs.queue

        this.channel.on("connect", async () => {
            await this.channel.deleteExchange(exchnage_config.name)
            await this.channel.deleteQueue(this.queueName)

            const {queue}=await this.channel.assertQueue(this.queueName, {   });
            const {exchange}=await this.channel.assertExchange(exchnage_config.name, exchnage_config.type, { durable: true });
            
            await this.channel.bindQueue(queue,exchange, queue_config.routingKey); 
 
            const handlers = await this.handlerService.getHandlers("controllers")
            for (const handler of handlers) {
                await this.consumeMessage({ handler })
            }
        })
    }

} 