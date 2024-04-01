import { Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';

@Injectable()
export class AmqpService {
    private connection: amqp.AmqpConnectionManager;

    connect(): amqp.AmqpConnectionManager {
        this.connection = amqp.connect('amqp://rabbitmq_username:rabbitmq_password@127.0.0.1:5672');
        return this.connection;
    }

    getConnection(): amqp.AmqpConnectionManager {
        return this.connection;
    }

    createChannel():  amqp.ChannelWrapper  {
        return this.connection.createChannel();
    }
}
