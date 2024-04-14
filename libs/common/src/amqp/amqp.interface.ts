import { Options } from "amqp-connection-manager"
import { PublishOptions } from "amqp-connection-manager/dist/types/ChannelWrapper"

export interface ExchangeRegisterConfigurationInterfaces {
    name: string
    type: "fanout" | "direct" | "header" | "topic"


}
export interface QueueRegisterConfigurationInterfaces {
    name: string
    routingKey: string
    options? : Options.AssertQueue

}

export interface AmqpRegisterConfigurationInterfaces {
    queue?: QueueRegisterConfigurationInterfaces
    exchnage?: ExchangeRegisterConfigurationInterfaces
    options?: {
        ack?: boolean
        nack?: boolean
    }
}

export interface HandlerListInterface {
    handler: HandlerInterface
    metaData: string;
}
export type HandlerInterface = (...args: any[]) => Promise<any>


export interface SendMessageInterfaceOptions {
    toQueue: string
    subscribe?: boolean
    queuName?: string
}

export interface ConsumeMessageInterface {
    handler: (...args: any[]) => Promise<any>
    metaData: string | "*"
}

export class ContentMessageAmqp {
    private payload: any
    private options: any
    private messagePattern: string

    constructor(messagePattern: string, payload: any, options: any) {
        this.payload = payload
        this.options = options
        this.messagePattern = messagePattern
    }
}

export interface MessageProperties extends PublishOptions {
    contentType?: string;
    contentEncoding?: string;
    headers: { [key: string]: any };
    deliveryMode?: number;
    priority?: number;
    correlationId?: string;
    replyTo?: string;
    expiration?: string;
    messageId?: string;
    timestamp?: number;
    type?: string;
    userId?: string;
    appId?: string;
    clusterId?: string;
}