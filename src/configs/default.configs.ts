import { AmqpRegisterConfigurationInterfaces } from "../interfaces/amqp.interface";
import { v4 as uuidv4 } from 'uuid';

let queueuuId = uuidv4()
let exchangeId = uuidv4()
export const _default_configs: AmqpRegisterConfigurationInterfaces = {
    exchanges: [{
        name: exchangeId,
        type: "direct"
    }],
    queues: [
        { name: queueuuId, options: {} },
    ],
    bindings: [
        {
            exchange: exchangeId,
            queue: queueuuId,
            pattern: queueuuId
        }
    ],
    connection: {
        host: "127.0.0.1",
        port: 5672,
        password: "rabbitmq_password",
        username: "rabbitmq_username"
    },
}