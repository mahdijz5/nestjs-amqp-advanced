import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';


@Injectable()
export class ConnectionService {
    private connection: amqp.AmqpConnectionManager;
    public channel: amqp.ChannelWrapper

    constructor(
    ) { }

    connect(url:string): amqp.AmqpConnectionManager {
        this.connection = amqp.connect(url);
        return this.connection;
    }

    createChannel(): amqp.ChannelWrapper {
        this.channel = this.connection.createChannel();
        return this.channel
    }
} 
