import { Injectable, SetMetadata, } from '@nestjs/common';
import { CREATE_CHANNEL } from '../amqp.constant';
import { UserController } from 'apps/user/src/user.controller';
import { DecoratorRegistry } from './decorator.registry';


export const CreateChannel = (messagePattern: string): MethodDecorator => {
    return (target, key, descriptor) => {
        const decoratorRegistry = new DecoratorRegistry(); // Create an instance of DecoratorRegistry
        new CreateChannelDecorator(decoratorRegistry,descriptor)
        SetMetadata(CREATE_CHANNEL, messagePattern)(target, key, descriptor);
        return descriptor;
    };
}; 

 

@Injectable() // Make the decorator injectable
export class CreateChannelDecorator {
  constructor(private readonly decoratorRegistry: DecoratorRegistry,private readonly t : any) {
      this.decoratorRegistry.addDecorator(CREATE_CHANNEL, this.t);

  } // Inject DecoratorRegistry 
  
}