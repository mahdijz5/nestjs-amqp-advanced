import { SetMetadata, } from '@nestjs/common';
import { CREATE_CHANNEL } from '../amqp.constant';
  

export const MessagePattern = (messagePattern: string): MethodDecorator => {
    return (target, key, descriptor) => {
        SetMetadata(CREATE_CHANNEL, messagePattern)(target, key, descriptor);
        return descriptor;
    };
}; 