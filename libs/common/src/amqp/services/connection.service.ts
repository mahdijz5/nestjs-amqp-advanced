import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
 

@Injectable()
export class ConnectionService {
    private connection: amqp.AmqpConnectionManager;
    public channel : amqp.ChannelWrapper

    constructor(
    ) {}

    connect(): amqp.AmqpConnectionManager {
        this.connection = amqp.connect('amqp://rabbitmq_username:rabbitmq_password@127.0.0.1:5672');
        return this.connection;
    }

    get getConnection(): amqp.AmqpConnectionManager {
        return this.connection
    }
 

    createChannel(): amqp.ChannelWrapper {
        this.channel= this.connection.createChannel();
        return this.channel
    }
} 
