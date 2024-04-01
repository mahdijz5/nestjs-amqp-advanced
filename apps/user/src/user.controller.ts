import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateChannel } from '@app/common/amqp/decorators/amqp.decorators';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @CreateChannel("test")  
  getHello(): string {
    console.log("######")
    return this.userService.getHello();
  }
} 
