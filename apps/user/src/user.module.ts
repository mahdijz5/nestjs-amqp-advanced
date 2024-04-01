import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AmqpModule } from '@app/common/amqp/amqp.module';

@Module({
  imports: [AmqpModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
