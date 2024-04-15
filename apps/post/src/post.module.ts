import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { AmqpModule } from '@app/common/amqp/modules/amqp.module';

@Module({
  imports: [
    AmqpModule.register({
      exchnage: {
        name: "post", 
        type: "direct"
      },
      queue: [{
        name: "post",
        routingKey: "post-queue",
      }]
    })],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule { }
