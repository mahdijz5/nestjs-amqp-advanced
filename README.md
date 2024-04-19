## NestJS RabbitMQ Advanced Config
[![npm version](https://badge.fury.io/js/%40mahdijz5%2Fnestjs-amqp-advanced.svg)](https://badge.fury.io/js/%40mahdijz5%2Fnestjs-amqp-advanced)

### Description
NestJS Amqp Advanced Config is a custom package designed to extend the capabilities of NestJS for integrating with RabbitMQ. While NestJS provides basic RabbitMQ integration through the `@nestjs/microservices` package, this custom package offers advanced configuration options for users who require more flexibility and control over their RabbitMQ setup.

### Features
- **Advanced Configuration Options**: Customize exchange types, declare and bind queues with specific options, configure message acknowledgment modes, and more.
- **Flexible Setup**: Easily integrate RabbitMQ into your NestJS application with advanced configuration tailored to your specific use cases.
- **Comprehensive Documentation**: Detailed documentation and examples to guide you through the setup process and demonstrate the usage of advanced features.
- **Message Pattern Definition**: Define message patterns for methods to be consumed through queues.
- **Access to amqplib Features**: Utilize features provided by the amqplib library directly within your NestJS application.

### Installation
```bash
npm install @mahdijz5/nestjs-amqp-advanced
```

## Setup
```typescript
import { Module } from '@nestjs/common';
import { AmqpModule } from '@mahdijz5/nestjs-amqp-advanced';

@Module({
  imports: [
    AmqpModule.forRoot({
      // configuration options here
    }),
  ],
})
export class AppModule {}
```
## Configuration Options
Exchange Types: Define exchange types such as direct, fanout, topic, headers, etc.
Queue Declaration and Binding: Declare queues with specific options and bind them to exchanges.
Connection Options: Configure connection settings including host, port, credentials, etc.


## Example
```typescript

@Module({
  imports: [
    AmqpModule.forRoot({
      exchanges: [
        { name: "exchange-1", type: "topic" }
      ],
      queues: [
        { name: "queue-1", options: {} },
        { name: "queue-2", options: { autoDelete: true } },
      ],
      bindings: [
        { exchange: "exchange-1", queue: "queue-1", pattern: "queue.*" }
      ],
      connection: {
        host: "127.0.0.1",
        port: 5672,
        password: "rabbitmq_password",
        username: "rabbitmq_username"
      },
    })
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
```

## Setting Message pattern
The @MessagePattern decorator defines message patterns for methods to be consumed through queues.

```typescript
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern("login")
  getHello(data: any): string {
    //  logic ...
  }
}
```

## Send Message

### Send to queue
``` typescript
 await this.amqpService.send("login", "queue-1", { ...payload }, { subscribe: true })
```
### Publish Message
``` typescript
 await this.amqpService.publish({payload,exchange,messagePattern ,routingKey,options : {subscribe :true}})
```


## Contributions
Contributions, bug reports, and feature requests are welcome! Feel free to open issues or pull requests on GitHub.
