import { Options } from "amqp-connection-manager"
import { PublishOptions } from "amqp-connection-manager/dist/types/ChannelWrapper"
import { AssertQueueArguments } from "./amqp-manager.interface"

export interface ExchangeRegisterConfigurationInterfaces {
    name: string
    type: "fanout" | "direct" | "header" | "topic"


}
export interface QueueRegisterConfigurationInterfaces extends Pick<AssertQueueArguments, "options"> {
    name: string
    routingKey?: string
    isDefault?: boolean

}

export interface AmqpRegisterConfigurationInterfaces {
    queue: QueueRegisterConfigurationInterfaces[]
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
    subscribe?: boolean
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