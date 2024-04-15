import { randomUUID } from "crypto";
import { AmqpRegisterConfigurationInterfaces } from "../interfaces/amqp.interface";
import { v4 as uuidv4 } from 'uuid';

let queueuuId = uuidv4()
export const _default_configs : AmqpRegisterConfigurationInterfaces = {
    exchnage : {
        name : uuidv4(),
        type : "direct"
    },
    queue : {
        name  : queueuuId,
        routingKey :queueuuId
    }
}