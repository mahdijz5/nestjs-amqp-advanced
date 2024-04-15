import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AmqpModule } from '@app/common/amqp/modules/amqp.module';

@Module({
  imports: [
    AmqpModule.register({
      exchnage: {
        name: "test",
        type: "direct"
      },
      queue: {
        name: "test2",
        routingKey: "test.*",
        options : {
          
        }
      }
    })],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
