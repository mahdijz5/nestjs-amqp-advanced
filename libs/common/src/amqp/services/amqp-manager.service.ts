import { ChannelWrapper } from "amqp-connection-manager"

import { AssertExchangeArguments, AssertQueueArguments, BindExchangeArguments, BindQueueArguments, ConsumerOptions, DeleteExchangeArguments, DeleteQueueArguments, PublishArguments, SendToQueueArguments, UnbindExchangeArguments } from '../interfaces/amqp-manager.interface';
import { Injectable } from "@nestjs/common";
export class AmqpManagerService {
    public channel: ChannelWrapper
    public deserializer: (message: any) => any
    public serializer: (value: any) => any
    constructor() {
        this.deserializer = (message) => JSON.parse(message.toString())
        this.serializer = (value) => Buffer.from(JSON.stringify(value))
    }

    /**
     *  Remove all undelivered messages from the queue named. Note that this won’t remove messages that have been delivered but *   not yet acknowledged; they will remain, and may be requeued under some circumstances (e.g., if the channel to which they *   were delivered closes without acknowledging them).
     * @param queue queue Name
     * @returns queue Name
     */
    public async purgeQueue(queue: string) {
        return await this.channel.purgeQueue(queue)
    }

    /**
     * 
     *  Delete the queue named. Naming a queue that doesn’t exist will result in the server closing the channel, to teach you a *   lesson (except in RabbitMQ version 3.2.0 and after1).
     * @param queue 
     * @param options : { ifUnused (boolean): if true and the queue has consumers, it will not be deleted and the channel will be closed. Defaults to false.
        ifEmpty (boolean): if true and the queue contains messages, the queue will not be deleted and the channel will be closed.   Defaults to false.} 
     * @returns 
     */
    public async deleteQueue({ options, queue }: DeleteQueueArguments) {
        return await this.channel.deleteQueue(queue, { ...options })
    }

    /**
     * 
     * @param queue queue name 
     * @param options exclusive: if true, scopes the queue to the connection (defaults to false)

durable: if true, the queue will survive broker restarts, modulo the effects of exclusive and autoDelete; this defaults to true if not supplied, unlike the others

autoDelete: if true, the queue will be deleted when the number of consumers drops to zero (defaults to false)

arguments: additional arguments, usually parameters for some kind of broker-specific extension e.g., high availability, TTL.
     * @returns 
     */
    public async assertQueue(argument?: AssertQueueArguments) {
        return await this.channel.assertQueue(argument.queue, { ...argument.options })
    }

    /**
     * Assert a routing path from an exchange to a queue: the exchange named by source will relay messages to the queue named, according to the type of the exchange and the pattern given. The RabbitMQ tutorials give a good account of how routing works in AMQP.
     * @param queue queue name
     * @param source exchange name
     * @param pattern routing key
     * @returns 
     */
    public async bindQueue({ exchange, queue, routingKey }: BindQueueArguments) {
        return await this.channel.bindQueue(queue, exchange, routingKey)
    }

    /**
     * Assert an exchange into existence. As with queues, if the exchange exists already and has properties different to those supplied, the channel will break; fields in the arguments object may or may not matter, depending on the type of exchange. Unlike queues, you must supply a name, and it can’t be the empty string. You must also supply an exchange type, which determines how messages will be routed through the exchange.
     * @param exchange exchange name  
     * @param type exchange type it can be "topic" | "header" | "direct" | "fanout"  
     * @param options 
     * durable (boolean): if true, the exchange will survive broker restarts. Defaults to true.

internal (boolean): if true, messages cannot be published directly to the exchange (i.e., it can only be the target of bindings, or possibly create messages ex-nihilo). Defaults to false.

autoDelete (boolean): if true, the exchange will be destroyed once the number of bindings for which it is the source drop to zero. Defaults to false.

alternateExchange (string): an exchange to send messages to if this exchange can’t route them to any queues.

arguments (object): any additional arguments that may be needed by an exchange type.
 
     * @returns 
     */
    public async assertExchange(argument?: AssertExchangeArguments) {
        return await this.channel.assertExchange(argument.exchange, argument.type, { ...argument.options })

    }

    /**
     * Check that an exchange exists. If it doesn’t exist, the channel will be closed with an error. If it does exist, happy days.
     * @param queue  queue name
     * @returns 
     */
    public async checkExchange(queue: string) {
        return await this.channel.checkExchange(queue)
    }

    /**
     * Delete an exchange. The only meaningful field in options
     * @param ifUnused (boolean): if true and the exchange has bindings, it will not be deleted and the channel will be closed. 
     * @returns 
     */
    public async deleteExchange({ options, exchange }: DeleteExchangeArguments) {
        return await this.channel.deleteExchange(exchange, { ...options })
    }

    /**
     * Bind an exchange to another exchange. The exchange named by destination will receive messages from the exchange named by source, according to the type of the source and the pattern given. For example, a direct exchange will relay messages that have a routing key equal to the pattern.
     * @param destination the exchnage that you want bind to
      * @returns 
     */
    public async bindExchange({ destination, source, routingKey }: BindExchangeArguments) {
        return await this.channel.bindExchange(destination, source, routingKey)
    }

    /**
     * Remove a binding from an exchange to another exchange. A binding with the exact source exchange, destination exchange, routing key pattern, and extension args will be removed. If no such binding exists, it’s – you guessed it – a channel error, except in RabbitMQ >= version 3.2.0, for which it succeeds trivially1.
      * @returns 
     */
    public async unbindExchange({ exchange, queue, routingKey }: UnbindExchangeArguments) {
        return await this.channel.unbindExchange(exchange, queue, routingKey)
    }



    public async consume(queue, callback: (msg: any) => any, options: ConsumerOptions) {
        return await this.channel.consume(queue, (message) => {
            callback({ ...message, content: this.deserializer(message.content) })
        }, <any>{ ...options })
    }
}