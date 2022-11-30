import { TodosAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'

// TODO: Implement businessLogic
const logger = createLogger('TodoAccess')
const attachmentUtils = new AttachmentUtils()
const todosAccess = new TodosAccess()

// Get Todos function
export async function getTodosByUserId(userId: string): Promise<TodoItem[]> {
    logger.info('Get all todo items')
    return todosAccess.getAllTodosByUserId(userId)
}

export async function createTodo(newTodo: CreateTodoRequest, userId: string): Promise<TodoItem> {
    logger.info('Create todo')

    const todoId = uuid.v4()
    const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
    const newItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: s3AttachmentUrl,
        ...newTodo
    }
    return await todosAccess.createTodoItem(newItem)
}

export async function updateTodo(todoId: string, updateTodoRequest: UpdateTodoRequest, userId: string): Promise<void> {
    const todoItem = await todosAccess.getTodoByUserIdAndTodoId(userId, todoId);

    await todosAccess.updateTodoByUserIdAndTodoId(todoItem.userId, todoItem.todoId, {
        name: updateTodoRequest.name,
        done: updateTodoRequest.done,
        dueDate: updateTodoRequest.dueDate,
    });
}

export async function deleteTodo(userId: string, todoId: string): Promise<string> {
    logger.info(`Delete todo: ${todoId}`)
    return todosAccess.deleteTodoItem(todoId, userId)
}

export async function createAttachmentPresignedUrl(todoId: string): Promise<string> {
    logger.info(`Create Attachment Presigned Url for todoId: ${todoId}`)
    return attachmentUtils.getUploadUrl(todoId)
}