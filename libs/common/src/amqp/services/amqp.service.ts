import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { CONFIG_OPTIONS } from '../amqp.constant';
import { AmqpRegisterConfigurationInterfaces, ConsumeMessageInterface, ContentMessageAmqp, HandlerInterface, MessageProperties, SendMessageInterfaceOptions } from '../amqp.interface';
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
    private _handlers: {
        handler: (...args: any[]) => Promise<any>;
        metaData: string;
    }[]
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



    async sendMessage(messagePattern: string, toQueue: string, payload: any, data?: SendMessageInterfaceOptions) {
        const { queue } = await this.channel.assertQueue("", {});
        let correlationId: string = uuidv4()

        const requestFib = new Promise(async (resolve) => {
            if (data.subscribe) {
                const consumer = await this.channel.consume(queue, (message) => {
                    this.channel.deleteQueue(queue)

                    if (!message) console.warn('[x] Consumer cancelled')
                    else if (message.properties.correlationId === correlationId) {
                        resolve(this.deserializer(message.content));
                        this.channel.cancel(consumer.consumerTag)
                    }
                    this.channel.ack(message)
                }, {})

            }


            const BufferedPayload = this.serializer(new ContentMessageAmqp(messagePattern, payload, {

            }))
            this.channel.sendToQueue(toQueue, BufferedPayload, <MessageProperties>{
                correlationId: subscribe ? correlationId : null,
                replyTo: queue,
            })

        });

        return await requestFib
    }



    private async consumeMessages() {
        await this.channel.consume(this._configs.queue.name, async (message) => {
            const messageData = this.deserializer(message.content)

            const payload = messageData.payload
            const messagePattern = messageData.messagePattern
            const options = messageData.options

            const handler = this.findHandlerForMessagePattern(messagePattern)
            if (handler) {
                this.handleMessage(handler, message)
                this.channel.ack(message);
            } else {
                console.error(`No handler found for message pattern: ${messagePattern}`);
                this.channel.ack(message); // Acknowledge message processing to avoid reprocessing
            }
        })
 
    }

    private findHandlerForMessagePattern(messagePattern: string): HandlerInterface {
        const handler = this._handlers.find(h => h.metaData === messagePattern);
        return handler ? handler.handler : undefined;
    }

    private async handleMessage(handler: HandlerInterface, message: any) {
        const messageData = this.deserializer(message.content)
        const payload = messageData.payload
        const options = messageData.options



        const replyTo = message.properties.replyTo
        const correlationId = message.properties.correlationId
        const res = await handler({ ...payload }, {}, {})
        console.log(res)
        if (correlationId) {
            this.channel.sendToQueue(replyTo, this.serializer(res), <MessageProperties>{
                correlationId
            });
        }


        return res
    }



    async onModuleInit() {
        await this.connectionService.connect()
        this.channel = await this.connectionService.createChannel()
        const exchnage_config = this._configs.exchnage
        const queue_config = this._configs.queue

        this.channel.on("connect", async () => {
            await this.channel.deleteExchange(exchnage_config.name)
            await this.channel.deleteQueue(this.queueName)

            const { queue } = await this.channel.assertQueue(this.queueName, { autoDelete: true });
            const { exchange } = await this.channel.assertExchange(exchnage_config.name, exchnage_config.type, { durable: true });

            await this.channel.bindQueue(queue, exchange, queue_config.routingKey);
            const handlers = await this.handlerService.getHandlers("controllers")
            this._handlers = handlers
            if (handlers.length > 0) {
                await this.consumeMessages()

            }

        })
        this.channel.on("close", () => {
            "test"
        })
    }

} 