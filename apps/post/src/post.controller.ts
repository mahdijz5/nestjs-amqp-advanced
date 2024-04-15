import { Controller, Get } from '@nestjs/common';
import { PostService } from './post.service';
import { AmqpService } from '@app/common/amqp/services/amqp.service';

@Controller("post")
export class PostController {
  constructor(private readonly postService: PostService, private readonly amqpService: AmqpService) { }

  @Get("hey")
  async getHello() {
    return await this.amqpService.publish({payload :"test",exchange :"test",messagePattern : "user.hello",routingKey : "queue.com",options : {subscribe :true}})
    return await this.amqpService.send("user.hello", "test2", { name: "test" }, { subscribe: true })
    // return this.postService.getHello();
  }

  @Get("bey")
  async getBye() {
    return await this.amqpService.send("user.bye", "test2", { name: "test" }, { subscribe: true })
    // return this.postService.getHello();
  }
}
