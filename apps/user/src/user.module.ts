import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AmqpModule } from '@app/common/amqp/modules/amqp.module';

@Module({
  imports: [
    AmqpModule.forRoot({
      exchnage: {
        name: "test",
        type: "topic"
      },
      queue: [{
        name: "queue-1",
        routingKey: "queue.*",
        options : {
          
        }
      },{
        name: "queue-2",
        routingKey: "queue-2*",
        options : {
          
        }
      }]
    })],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
