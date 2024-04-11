import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { AmqpService } from '@app/common/amqp/services/amqp.service';
import { MessagePattern } from '@app/common/amqp/decorators/amqp.decorators';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService,private readonly amqpService : AmqpService) {}

  @MessagePattern("user.hello")
  getHello(data : any): string {
    console.log(data)
    return this.userService.getHello();
  }
}
