import { Controller, Get } from '@nestjs/common';
import { PostService } from './post.service';
import { AmqpService } from '@app/common/amqp/services/amqp.service';

@Controller("post")
export class PostController {
  constructor(private readonly postService: PostService,private readonly amqpService : AmqpService) {}

  @Get()
  async getHello(){
    const res = await this.amqpService.sendMessage("user",{name : "test"},{toQueue :"user",subscribe :true})
      console.log(res)
    // return this.postService.getHello();
  }
}
