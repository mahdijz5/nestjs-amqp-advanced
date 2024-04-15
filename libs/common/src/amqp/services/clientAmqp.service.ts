import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { CONFIG_OPTIONS, QUEUE_REGISTER } from '../amqp.constant';
import { AmqpRegisterConfigurationInterfaces, ConsumeMessageInterface, ContentMessageAmqp, HandlerInterface, MessageProperties, SendMessageInterfaceOptions } from '../interfaces/amqp.interface';
import { ModulesContainer } from '@nestjs/core';
import { ConnectionService } from './connection.service';
import { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { HandlerService } from './handler.service';
import { _default_configs } from '../configs/default.configs';
import { subscribe } from 'diagnostics_channel';
import { AmqpManagerService } from './amqp-manager.service';
import { PublishArguments } from '../interfaces/amqp-manager.interface';
import { AmqpService } from './amqp.service';


@Injectable()
export class ClientAmqp extends AmqpManagerService  {
  
    public channel: amqp.ChannelWrapper

    constructor(
        @Inject(QUEUE_REGISTER) private queue:string,
        // private readonly amqpService : AmqpService
 
    ) {
        super()
        console.log("queue---")
        console.log(queue)
        // this.channel = amqpService.channel
      
    }
 


    async send(messagePattern: string, payload: any, options?: SendMessageInterfaceOptions) {
        const { queue: replyTo } = await this.channel.assertQueue("", {});
        let correlationId: string = uuidv4()

        const requestFib = new Promise(async (resolve) => {
            if (options.subscribe) {
                const consumer = await this.consume(replyTo, (message) => {
                    this.channel.deleteQueue(replyTo)

                    if (!message) console.warn('[x] Consumer cancelled')
                    else if (message.properties.correlationId === correlationId) {
                        resolve(message.content);
                        this.channel.cancel(consumer.consumerTag)
                    }
                    this.channel.ack(message)
                }, {})

            }
            const BufferedPayload = this.serializer(new ContentMessageAmqp(messagePattern, payload, {}))

            this.channel.sendToQueue(this.queue, BufferedPayload, <MessageProperties>{
                correlationId: subscribe ? correlationId : null,
                replyTo: replyTo,
            })

        });

        return await requestFib
    }



     
  
} 