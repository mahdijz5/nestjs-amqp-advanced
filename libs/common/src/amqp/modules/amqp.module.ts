import { DynamicModule, Inject, Module, OnModuleInit, ParamData, Scope, Type, forwardRef } from '@nestjs/common';
import { AmqpService } from '../services/amqp.service';
import { CONFIG_OPTIONS, CREATE_CHANNEL, QUEUE_REGISTER } from '../amqp.constant';
import { UserController } from 'apps/user/src/user.controller';
import { MetadataScanner, ModulesContainer, Reflector } from '@nestjs/core';
import { flatMap, get, isNil, some, uniqBy, isObject } from 'lodash';
import { Module as ModuleContainer } from '@nestjs/core/injector/module';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RabbitRpcParamsFactory } from '../rabbitmq.factory';
import { AmqpRegisterConfigurationInterfaces } from '../interfaces/amqp.interface';
import { ConnectionService } from '../services/connection.service';
import { TestingModule } from '@nestjs/testing';
import { HandlerModule } from './handler.module';
import { HandlerService } from '../services/handler.service';
import { AmqpManagerService } from '../services/amqp-manager.service';
import { ClientAmqp } from '../services/clientAmqp.service';

@Module({})
export class AmqpModule {
  private queueName: string;

  static forRoot(options: AmqpRegisterConfigurationInterfaces): DynamicModule {

    return {
      module: AmqpModule,
      imports: [HandlerModule, MetadataScanner, ModulesContainer, ExternalContextCreator],
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        }, AmqpService, ConnectionService, MetadataScanner, ModulesContainer, ExternalContextCreator, RabbitRpcParamsFactory],
      exports: [AmqpService, MetadataScanner, ModulesContainer, ExternalContextCreator, RabbitRpcParamsFactory],
    };
  }
 
  constructor(
    
  ) { }


}
