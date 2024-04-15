import { DynamicModule, Inject, Injectable, Module, OnModuleInit, ParamData, Scope, Type, forwardRef } from '@nestjs/common';
import { CONFIG_OPTIONS, CREATE_CHANNEL, RABBIT_HEADER_TYPE, RABBIT_PARAM_TYPE, RABBIT_REQUEST_TYPE } from '../amqp.constant';
import { MetadataScanner, ModulesContainer, Reflector } from '@nestjs/core';
import { flatMap, get, isNil, isObject } from 'lodash';
import { Module as ModuleContainer } from '@nestjs/core/injector/module';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RabbitRpcParamsFactory } from '../rabbitmq.factory';
import { AmqpRegisterConfigurationInterfaces } from '../interfaces/amqp.interface';



@Injectable()
export class HandlerService {
    private register_config: AmqpRegisterConfigurationInterfaces


    constructor(
        private readonly modulesContainer: ModulesContainer,
        private readonly metadataScanner: MetadataScanner,
        private readonly externalContextCreator: ExternalContextCreator,
        private readonly rpcParamsFactory: RabbitRpcParamsFactory,
    ) {

    }


    private async toDiscoveredClass(
        nestModule: ModuleContainer,
        wrapper: InstanceWrapper<any>
    ) {
        const instanceHost = wrapper.getInstanceByContextId(
            STATIC_CONTEXT,
            wrapper && wrapper.id ? wrapper.id : undefined
        )


        if (instanceHost.isPending && !instanceHost.isResolved) {
            await instanceHost.donePromise;
        }

        return {
            name: wrapper.name as string,
            instance: instanceHost.instance,
            injectType: wrapper.metatype,
            dependencyType: get(instanceHost, 'instance.constructor'),
            parentModule: {
                name: nestModule.metatype.name,
                instance: nestModule.instance,
                injectType: nestModule.metatype,
                dependencyType: nestModule.instance.constructor as Type<object>,
            },
        };
    }

    private extractMethodMetaAtKey<T>(
        metaKey,
        discoveredClass,
        prototype: any,
        methodName: string
    ) {
        const handler = prototype[methodName];
        const meta: T = Reflect.getMetadata(metaKey, handler);

        return {
            meta,
            discoveredMethod: {
                handler,
                methodName,
                parentClass: discoveredClass,
            },
        };
    }

    classMethodsWithMetaAtKey(
        component,
        metaKey
    ) {
        const { instance } = component;

        if (!instance) {
            return [];
        }

        const prototype = Object.getPrototypeOf(instance);

        return this.metadataScanner.getAllMethodNames(prototype).map((name) =>
            this.extractMethodMetaAtKey(metaKey, component, prototype, name)
        ).filter((x) => !isNil(x.meta));
    }
    public exchangeKeyForValue(type: number, data: any, args: any[]) {
        if (!args) {
            return null;
        }

        let index = 0;
        if (type === RABBIT_PARAM_TYPE) {
            index = 0;
        } else if (type === RABBIT_REQUEST_TYPE) {
            index = 1;
        } else if (type === RABBIT_HEADER_TYPE) {
            index = 2;
        }

        return data && !isObject(data) ? args[index]?.[data] : args[index];
    }

    async getHandlers(component: "controllers" | "providers"): Promise<{ handler: ((...args: any[]) => Promise<any>), metaData: string }[]> {
        const modulesMap = [...this.modulesContainer.entries()];

        const providers = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            flatMap(modulesMap, ([key, nestModule]) => {
                const components = [...nestModule[component].values()];
                return components
                    .filter((component) => component.scope !== Scope.REQUEST)
                    .map((component) => {

                        return this.toDiscoveredClass(nestModule, component)
                    });
            })
        );
        const methodes = flatMap(providers, (provider) => {
            return this.classMethodsWithMetaAtKey(provider, CREATE_CHANNEL)
        }
        )
        const handlerList: { handler: ((...args: any[]) => Promise<any>), metaData: string }[] = []
        for (const methode of methodes) {
            const discoveredMethod = methode.discoveredMethod
            const meta = methode.meta
            const handler = this.externalContextCreator.create(
                discoveredMethod.parentClass.instance,
                discoveredMethod.handler,
                discoveredMethod.methodName,
                ROUTE_ARGS_METADATA,
                this.rpcParamsFactory,
                undefined, // contextId
                undefined, // inquirerId
                undefined, // options
                'rmq' // contextType
            );
            handlerList.push({ handler, metaData: meta })
        }

        return handlerList
    }
}
