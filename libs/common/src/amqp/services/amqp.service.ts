import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { CONFIG_OPTIONS } from '../amqp.constant';
import { AmqpRegisterConfigurationInterfaces, ConsumeMessageInterface, ContentMessageAmqp, HandlerInterface, MessageProperties, SendMessageInterfaceOptions } from '../interfaces/amqp.interface';
import { ModulesContainer } from '@nestjs/core';
import { ConnectionService } from './connection.service';
import { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { HandlerService } from './handler.service';
import { _default_configs } from '../configs/default.configs';
import { subscribe } from 'diagnostics_channel';
import { AmqpManagerService } from './amqp-manager.service';
import { PublishArguments } from '../interfaces/amqp-manager.interface';


@Injectable()
export class AmqpService extends AmqpManagerService implements OnModuleInit {
    private _default_configs: AmqpRegisterConfigurationInterfaces
    private _registered_configs: AmqpRegisterConfigurationInterfaces
    private _configs: AmqpRegisterConfigurationInterfaces
    private _handlers: {
        handler: (...args: any[]) => Promise<any>;
        metaData: string;
    }[]

    private default_queue: string

    public channel: amqp.ChannelWrapper
    constructor(
        @Inject(CONFIG_OPTIONS) private options: AmqpRegisterConfigurationInterfaces,
        private readonly connectionService: ConnectionService,
        private readonly handlerService: HandlerService,

    ) {
        super()

        this._default_configs = _default_configs
        this._registered_configs = this.options
        this._configs = { ...this._default_configs, ...this._registered_configs }
    }


    get handlerList() {
        return this._handlers
    }



    get configs() {
        return this.configs
    }


    /**
     * Publish a single message to an exchange.
     * @param payload 
     * @param messagePattern 
     * @param exchange 
     * @param routingKey
     * @param options : {
     *  subscribe: if true, result will be replyed
     * } 
     * @returns 
     */
    public async publish({ payload, messagePattern, exchange, routingKey, options }: PublishArguments) {
        const { queue: replyTo } = await this.channel.assertQueue("", {});
        let correlationId: string = uuidv4()

        const requestFib = new Promise(async (resolve) => {
            if (options?.subscribe) {
                const consumer = await this.consume(replyTo, (message) => {
                    this.channel.deleteQueue(replyTo)
                    if (!message) console.warn('[x] Consumer cancelled')
                    else if (message.properties.correlationId === correlationId) {
                        resolve(message.content);
                        this.channel.cancel(consumer.consumerTag)
                    }
                    this.channel.ack(message)
                }, {})
                const BufferedPayload = this.serializer(new ContentMessageAmqp(messagePattern, payload, {}))

                await this.channel.publish(exchange, routingKey, BufferedPayload, <any>{
                    ...options,
                    correlationId: subscribe ? correlationId : null,
                    replyTo: replyTo,
                })

            } else {
                resolve(true)
            }

        });
        return await requestFib
    }

    /**
     * Send a single message with the content given as a buffer to the specific queue named, bypassing routing. The options and return value are exactly the same as for publish.
     * @param messagePattern 
     * @param queue 
     * @param payload no need to serialize
     * @param options : {
     *  subscribe: if true, result will be replyed
     * }
     * @returns 
     */
    async send(messagePattern: string, queue: string, payload: any, options?: SendMessageInterfaceOptions) {
        const { queue: replyTo } = await this.channel.assertQueue("", {});
        let correlationId: string = uuidv4()

        const requestFib = new Promise(async (resolve) => {
            if (options.subscribe) {
                const consumer = await this.consume(replyTo, (message) => {
                    this.channel.deleteQueue(replyTo)

                    if (!message) console.warn('[x] Consumer cancelled')
                    else if (message.properties.correlationId === correlationId) {
                        resolve(message.content);
                        this.channel.cancel(consumer.consumerTag)
                    }
                    this.channel.ack(message)
                }, {})

            }
            const BufferedPayload = this.serializer(new ContentMessageAmqp(messagePattern, payload, {}))
            this.channel.sendToQueue(queue, BufferedPayload, <MessageProperties>{
                correlationId: subscribe ? correlationId : null,
                replyTo: replyTo,
            })

        });

        return await requestFib
    }



    private async consumeMessages(queue: string) {
        await this.channel.consume(queue, async (message) => {
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
            await this.deleteExchange({ exchange: exchnage_config.name })
            const { exchange } = await this.assertExchange({ exchange: exchnage_config.name, type: exchnage_config.type, options: { durable: true } });
            if (this._configs.queue.length <= 0) {
                throw new BadRequestException("At least one queue should be defined.")
            }

            for (let queueItem of this._configs.queue) {
                await this.deleteQueue({ queue: queueItem.name })
                const { queue } = await this.assertQueue({ queue: queueItem.name, options: { ...queueItem.options } });
                await this.bindQueue({ queue, exchange, routingKey: queueItem.routingKey || queue });
                if (queueItem.isDefault) this.default_queue = queue
            }
            if (!this.default_queue) {
                if (this._configs.queue[0]) {
                    this.default_queue = this._configs.queue[0].name
                }
            }


            const handlers = await this.handlerService.getHandlers("controllers")
            this._handlers = handlers
            if (handlers.length > 0) {
                for (let queueItem of this._configs.queue) {
                    await this.consumeMessages(queueItem.name)
                }

            }

        })
        this.channel.on("close", () => {

        })
    }

} 