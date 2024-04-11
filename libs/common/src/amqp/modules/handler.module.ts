import { DynamicModule, Inject, Module, OnModuleInit, ParamData, Scope, Type, forwardRef } from '@nestjs/common';
import { MetadataScanner, ModulesContainer, Reflector } from '@nestjs/core';
import { HandlerService } from '../services/handler.service';
import { RabbitRpcParamsFactory } from '../rabbitmq.factory';

@Module({ 
    imports : [ ModulesContainer,MetadataScanner,RabbitRpcParamsFactory],
    providers : [HandlerService,MetadataScanner,RabbitRpcParamsFactory],
    exports :[HandlerService],
}) 
export class HandlerModule   {
   constructor( 
    ) {
        console.log("the fuck?")
    }

  

}
