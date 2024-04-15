 
export interface AssertQueueArguments {
    queue: string
    options?: {
        exclusive?: boolean,
        durable?: boolean,
        autoDelete?: boolean
    }
}

export interface DeleteQueueArguments {
    queue: string
    options?: {
        ifUnused?: boolean,
        ifEmpty?: boolean,
    }
}


export interface AssertExchangeArguments {
    exchange: string,
    type: "topic" | "header" | "direct" | "fanout"
    options?: {
        internal?: boolean,
        durable?: boolean,
        autoDelete?: boolean
        alternateExchange?: boolean
    }
}

export interface DeleteExchangeArguments {
    exchange: string
    options?: {
        ifUnused?: boolean
    }
}

export interface BindQueueArguments {
    queue: string,
    exchange: string
    routingKey: string
}

export interface BindExchangeArguments {
    destination: string,
    source: string
    routingKey: string
}

export interface UnbindExchangeArguments {
    queue: string,
    exchange: string
    routingKey: string
}

export interface SendToQueueArguments {
    queue: string,
    payload: any
    options?: {
        consumerTag?: string,
        noLocal?: boolean
        noAck?: boolean
        exclusive?: boolean
        priority?: number
    }
}

export interface ConsumerOptions {
    consumerTag?: string
    noLocal?: boolean
    noAck?: boolean
    exclusive?: boolean
    priority?: number
}

export interface PublishArguments {
    exchange: string,
    routingKey: any,
    payload: any
    options?: {
        expiration?: string,
        userId?: string
        CC?: string[]
        persistent?: boolean
        priority?: number
        deliveryMode?: boolean
        mandatory?: boolean
        immediate?: boolean
        contentType?: string
        contentEncoding?: string
        headers?: any
        correlationId?: string
        replyTo?: string
        messageId?: string
        timestamp?: number
        type?: string
        appId?: string
    }
}
