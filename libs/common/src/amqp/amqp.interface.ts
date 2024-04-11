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

export interface SendMessageInterface {
    destQueue: string
    subscribe?: boolean
    payload?: any
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