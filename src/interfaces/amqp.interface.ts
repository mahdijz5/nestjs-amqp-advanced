import { Options } from "amqp-connection-manager"
import { PublishOptions } from "amqp-connection-manager/dist/types/ChannelWrapper"
import { AssertExchangeArguments, AssertQueueArguments } from "./amqp-manager.interface"

export interface ExchangeRegisterConfigurationInterfaces extends Pick<AssertExchangeArguments, "options"> {
    name: string
    type: "fanout" | "direct" | "header" | "topic"


}
export interface QueueRegisterConfigurationInterfaces extends Pick<AssertQueueArguments, "options"> {
    name: string
    isDefault?: boolean
    options?: {
        internal?: boolean,
        durable?: boolean,
        autoDelete?: boolean
        alternateExchange?: boolean
    }

}

export interface BindingRegisterConfigurationInterfaces {
    exchange: string
    queue: string
    pattern?: string
}

export interface AmqpRegisterConfigurationInterfaces {
     queues: QueueRegisterConfigurationInterfaces[]
    exchanges?: ExchangeRegisterConfigurationInterfaces[]
    bindings?: BindingRegisterConfigurationInterfaces[]
    options?: {
        ack?: boolean
        nack?: boolean
    },
    connection: {
        host: string,
        port: number,
        username?: string,
        password?: string,
    },
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