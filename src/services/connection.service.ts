import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { AmqpRegisterConfigurationInterfaces } from '../interfaces/amqp.interface';


@Injectable()
export class ConnectionService {
    private connection: amqp.AmqpConnectionManager;
    public channel: amqp.ChannelWrapper

    constructor(
    ) { }

    connect(connection: AmqpRegisterConfigurationInterfaces["connection"]): amqp.AmqpConnectionManager {
        const url = `amqp://${connection.username}${connection.password ? ":" + connection.password + "@" : ""}${connection.host}${connection.port ? ":" + connection.port : ""}`
        this.connection = amqp.connect(url);
        return this.connection;
    }

    createChannel(): amqp.ChannelWrapper {
        this.channel = this.connection.createChannel();
        return this.channel
    }
} 
