import cors from "@fastify/cors";
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Fastify from "fastify";
import { getAllCollaborators, getCollaboratorById } from "./controllers/collaboratorsController";
import { createProject, deleteProject, getAllProjects, getProjectById, modifyProject } from "./controllers/projectController";
import { createTask, deleteTask, getAllTasks, getTaskById, modifyTask } from "./controllers/taskController";
import { getDayTotalMinutes, getMonthTotalMinutes } from "./controllers/timeController";
import { createTimeTracker, deleteTT, getAllTimeTrackers, getTimeTrackerById, modifyTimeTracker } from "./controllers/timetrackController";
import { checkCollaborators, checkUsers } from "./controllers/userController";


const prisma = new PrismaClient({
  // log: ['query']
})

const fastify = Fastify({
  logger: true,
})

const jwt = require('fastify-jwt');

fastify.register(jwt, { secret: 'my-secret' });


async function bootstrap() {

  await fastify.register(cors, {
    origin: true
  })

  // Authentication routes

  fastify.post('/login', async (request: any, reply: any) => {
    const { username, password } = request.body;
    const user = await prisma.users.findFirst({
      where: {
        username
      }
    });
    if (!user) {
      reply.status(401).send({ error: 'Usuário ou Senha inválida' });
      return
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (isValidPassword) {
      const token = fastify.jwt.sign({ id: user.id, username: user.username }, { expiresIn: '1d' });

      reply.send({ token, username });
    } else {
      reply.status(401).send({ error: 'Usuário ou Senha inválida' });
    }
  }
  )

  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch (error) {
      reply.send(error)
    }
  })

  fastify.get('/validatetoken',
    {
      onRequest: [fastify.authenticate]
    }, async (request: any, reply: any) => {
      return request.user
    })


  // Project routes
  fastify.get('/projects', { onRequest: [fastify.authenticate] }, getAllProjects
  );

  fastify.get('/projects/:id', { onRequest: [fastify.authenticate] }, getProjectById);
  fastify.post('/projects', { onRequest: [fastify.authenticate] }, createProject)
  fastify.delete('/projects/:id', { onRequest: [fastify.authenticate] }, deleteProject)
  fastify.put('/projects/:id', { onRequest: [fastify.authenticate] }, modifyProject)

  // Task routes
  fastify.get('/tasks', { onRequest: [fastify.authenticate] }, getAllTasks)
  fastify.get('/tasks/:id', { onRequest: [fastify.authenticate] }, getTaskById);
  fastify.post('/tasks', { onRequest: [fastify.authenticate] }, createTask);
  fastify.delete('/tasks/:id', { onRequest: [fastify.authenticate] }, deleteTask)
  fastify.put('/tasks/:id', { onRequest: [fastify.authenticate] }, modifyTask)


  // TimeTrack routes
  fastify.get('/timetrackers', { onRequest: [fastify.authenticate] }, getAllTimeTrackers)
  fastify.get('/timetrackers/:id', { onRequest: [fastify.authenticate] }, getTimeTrackerById);
  fastify.post('/timetrackers', { onRequest: [fastify.authenticate] }, createTimeTracker)
  fastify.put('/timetrackers/:id', { onRequest: [fastify.authenticate] }, modifyTimeTracker)
  fastify.delete('/timetrackers/:id', { onRequest: [fastify.authenticate] }, deleteTT)


  //Time routes
  fastify.post('/daytotalminutes', { onRequest: [fastify.authenticate] }, getDayTotalMinutes)
  fastify.get('/monthtotalminutes', { onRequest: [fastify.authenticate] }, getMonthTotalMinutes)

  fastify.get('/collaborators', { onRequest: [fastify.authenticate] }, getAllCollaborators)
  fastify.get('/collaborators:id', { onRequest: [fastify.authenticate] }, getCollaboratorById)




  await fastify.listen({ port: 3333, host: '0.0.0.0' })

}


bootstrap()
checkUsers()
setTimeout(() => {
  checkCollaborators()
}, 5000);