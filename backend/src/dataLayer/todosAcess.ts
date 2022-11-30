import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
var AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
    ) { }

    async getAllTodosByUserId(userId: string): Promise<TodoItem[]> {
        const result = await this.docClient
            .query({
                TableName: this.todosTable,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            })
            .promise()
        return result.Items as TodoItem[]
    }

    async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
        const result = await this.docClient
            .put({
                TableName: this.todosTable,
                Item: todoItem
            })
            .promise()
        logger.info('Todo item created', result)
        return todoItem as TodoItem
    }

    async updateTodoItem(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate> {
        await this.docClient
            .update({
                TableName: this.todosTable,
                Key: {
                    todoId,
                    userId
                },
                UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
                ExpressionAttributeValues: {
                    ':name': todoUpdate.name,
                    ':dueDate': todoUpdate.dueDate,
                    ':done': todoUpdate.done
                },
                ExpressionAttributeNames: {
                    '#name': 'name'
                },
                ReturnValues: 'UPDATED_NEW'
            })
            .promise()
        return todoUpdate as TodoUpdate
    }

    async deleteTodoItem(todoId: string, userId: string): Promise<string> {
        await this.docClient
            .delete({
                TableName: this.todosTable,
                Key: {
                    todoId,
                    userId
                }
            })
            .promise()
        return todoId as string
    }

    async getTodoByUserIdAndTodoId(userId: string, todoId: string): Promise<TodoItem> {
        logger.info(`Getting todo item: ${todoId}`);
        const result = await this.docClient
            .query({
                TableName: this.todosTable,
                KeyConditionExpression: 'userId = :userId and todoId = :todoId',
                ExpressionAttributeValues: {
                    ':userId': userId,
                    ':todoId': todoId
                }
            })
            .promise();
        const todoItem = result.Items[0];
        return todoItem as TodoItem;
    }

    async updateTodoByUserIdAndTodoId(userId: string, todoId: string, updateData: TodoUpdate): Promise<void> {
        logger.info(`Updating a todo item: ${todoId}`);
        await this.docClient
            .update({
                TableName: this.todosTable,
                Key: { userId, todoId },
                ConditionExpression: 'attribute_exists(todoId)',
                UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
                ExpressionAttributeNames: {
                    '#name': 'name'
                },
                ExpressionAttributeValues: {
                    ':name': updateData.name,
                    ':dueDate': updateData.dueDate,
                    ':done': updateData.done
                }
            })
            .promise();
    }
}
