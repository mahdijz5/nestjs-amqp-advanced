import { PublishOptions } from "amqp-connection-manager/dist/types/ChannelWrapper"

export interface ExchangeRegisterConfigurationInterfaces {
    name: string
    type: "fanout" | "direct" | "header"


}
export interface QueueRegisterConfigurationInterfaces {
    name: string
    routingKey: string

}

export interface AmqpRegisterConfigurationInterfaces {
    queue?: QueueRegisterConfigurationInterfaces
    exchnage?: ExchangeRegisterConfigurationInterfaces
}



export interface SendMessageInterfaceOptions {
    toQueue: string
    subscribe?: boolean
    queuName?: string
}

export interface ConsumeMessageInterface {
    handler: (...args: any[]) => Promise<any>
}

export class ContentMessageAmqp {
    private payload: any
    private options: any

    constructor(payload: any, options: any) {
        this.payload = payload
        this.options = options
    }
}

export interface MessageProperties extends PublishOptions{
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