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

    public async purgeQueue(queue: string) {
        return await this.channel.purgeQueue(queue)
    }

    public async deleteQueue({ options, queue }: DeleteQueueArguments) {
        return await this.channel.deleteQueue(queue, { ...options })
    }

    public async assertQueue(argument?: AssertQueueArguments) {
        return await this.channel.assertQueue(argument.queue, { ...argument.options })
    }

    public async bindQueue({ exchange, queue, routingKey }: BindQueueArguments) {
        return await this.channel.bindQueue(queue, exchange, routingKey)
    }

    public async assertExchange(argument?: AssertExchangeArguments) {
        return await this.channel.assertExchange(argument.exchange, argument.type, { ...argument.options })
    }

    public async checkExchange(queue: string) {
        return await this.channel.checkExchange(queue)
    }

    public async deleteExchange({ options, exchange }: DeleteExchangeArguments) {
        return await this.channel.deleteExchange(exchange, { ...options })
    }

    public async bindExchange({ destination, source, routingKey }: BindExchangeArguments) {
        return await this.channel.bindExchange(destination, source, routingKey)
    }

    public async unbindExchange({ exchange, queue, routingKey }: UnbindExchangeArguments) {
        return await this.channel.unbindExchange(exchange, queue, routingKey)
    }


    public async publish({ payload, exchange,routingKey, options }: PublishArguments) {
        return await this.channel.publish(exchange,routingKey,this.serializer(payload),<any>{...options})
    }

    public async consume(queue,callback : (msg:any) => any ,options : ConsumerOptions) {
        return await this.channel.consume(queue,(message) => {
            callback({...message,content : this.deserializer(message.content)})
        },<any>{...options})
    }
}