import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AmqpModule } from '@app/common/amqp/modules/amqp.module';

@Module({
  imports: [AmqpModule.register({
    exchnage : {
      name : "user",
      type : "direct"
    },
    queue :{
      name : "user",
      routingKey : "user-queue"
    }
  })], 
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}  
 