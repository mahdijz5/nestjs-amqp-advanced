import { BadRequestException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { CONFIG_OPTIONS } from '../amqp.constant';
import { AmqpRegisterConfigurationInterfaces, ConsumeMessageInterface, ContentMessageAmqp, HandlerInterface, MessageProperties, SendMessageInterfaceOptions } from '../interfaces/amqp.interface';
import { ConnectionService } from './connection.service';
import { v4 as uuidv4 } from 'uuid';
import { HandlerService } from './handler.service';
import { _default_configs } from '../configs/default.configs';
import { subscribe } from 'diagnostics_channel';
import { AmqpManagerService } from './amqp-manager.service';
import { PublishArguments } from '../interfaces/amqp-manager.interface';

const logger = new Logger('Amqp-Enhanced');
@Injectable()
export class AmqpService extends AmqpManagerService implements OnModuleInit {
    private _default_configs: AmqpRegisterConfigurationInterfaces
    private _registered_configs: AmqpRegisterConfigurationInterfaces
    private _configs: AmqpRegisterConfigurationInterfaces
    private _connection: AmqpRegisterConfigurationInterfaces["connection"]
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
        this._connection = this._configs.connection
    }


    get handlerList() {
        return this._handlers
    }



    get configs() {
        return this._configs
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
        logger.log(`${queue} has been initialized.`)
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
                logger.error(`No handler found for message pattern: ${messagePattern}`);
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

        await this.connectionService.connect(this._connection)
        this.channel = await this.connectionService.createChannel()
        const exchanges = this._configs.exchanges
        const queues = this._configs.queues
        const bindings = this._configs.bindings

        if (this._configs.queues.length <= 0) {
            logger.error("At least one queue should be defined.")
            throw new BadRequestException("At least one queue should be defined.")
        }

        this.channel.on("connect", async () => {
            for (let queue of queues) {
                await this.deleteQueue({ queue: queue.name })
                const { queue: createdQueue } = await this.assertQueue({ queue: queue.name, options: { ...queue.options } });
                if (queue.isDefault) this.default_queue = createdQueue
            }

            for (let exchange of exchanges) {
                await this.deleteExchange({ exchange: exchange.name })
                const { exchange: createdExchange } = await this.assertExchange({ exchange: exchange.name, type: exchange.type, options: exchange.options });
            }

            for (let binding of bindings) {
                await this.bindQueue({ queue: binding.queue, exchange: binding.exchange, routingKey: binding.pattern || binding.queue });
            }




            if (!this.default_queue) {
                if (this._configs.queues[0]) {
                    this.default_queue = this._configs.queues[0].name
                }
            }


            const controlelrs = await this.handlerService.getHandlers("controllers")
            const providers = await this.handlerService.getHandlers("providers")
            this._handlers = [...controlelrs, ...providers]
            if (this._handlers.length > 0) {
                for (let queueItem of this._configs.queues) {
                    await this.consumeMessages(queueItem.name)

                }

            }
            logger.log("Loaded ...")
        })
        this.channel.on("close", () => {
            logger.error("Connection has been disconnected ...")

        })
    }

} 