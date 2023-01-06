import { PrismaClient } from '@prisma/client';
import moment from 'moment-timezone';

const prisma = new PrismaClient({
  // log: ['query']
})

export async function getAllTimeTrackers() {
  return await prisma.timeTracker.findMany({
    select: {
      id: true,
      startDate: true,
      endDate: true,
      taskId: true,
      collaboratorId: true
    },
    orderBy: {
      startDate: 'asc'
    }
  })
}

export async function createTimeTracker(request, reply) {
  const { startDate, endDate, taskId, collaboratorId }: any = request.body;
  const overlappingTimetrackers = await prisma.timeTracker.findMany({
    where: {
      AND: [
        { startDate: { gte: startDate } },
        { endDate: { lte: endDate } },
      ],
    },
  });
  if (moment(startDate).isAfter(endDate)) {
    return reply.status(400).send({ error: 'O horário de término deve ser MAIOR que o de início!' });
  }
  else if (overlappingTimetrackers.length > 0) {
    return reply.status(400).send({ error: 'Já existe um timetracker para este intervalo de tempo' });
  } else {
    const timeZoneId = moment.tz.guess();
    if (collaboratorId) {
      const timetracker = await prisma.timeTracker.create({
        data: {
          startDate,
          endDate,
          timeZoneId,
          collaborator: {
            connect: {
              id: collaboratorId
            }
          },
          task: {
            connect: {
              id: taskId
            }
          }

        },

      });
      reply.status(201).send(timetracker);
    } else {
      const timetracker = await prisma.timeTracker.create({
        data: {
          startDate,
          endDate,
          timeZoneId,
          task: {
            connect: {
              id: taskId
            }
          }
        },

      });
      reply.status(201).send(timetracker);
    }
  }
}

export async function modifyTimeTracker(request, reply) {
  const TimeTrackerId = request.params.id;
  const { startDate, endDate, taskId, collaboratorId } = request.body
  try {
    const timeTracker = await prisma.timeTracker.findFirst({
      where: {
        id: TimeTrackerId,
      },
    })
    if (!timeTracker) {
      reply.status(404).send({ error: "TimeTracker não encontrado!" })
    }
    const timeTrackerUpdated = await prisma.timeTracker.update({
      where: {
        id: TimeTrackerId
      },
      data: {
        startDate,
        endDate,
        task: {
          connect: {
            id: taskId
          }
        },
        collaborator: {
          connect: {
            id: collaboratorId
          }
        }
      },
      select: {
        startDate: true,
        endDate: true,
        task: {
          select: {
            name: true
          }
        },
        collaborator: {
          select: {
            name: true
          }
        }
      }
    })
    reply.status(201).send(timeTrackerUpdated)

  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
}

export async function getTimeTrackerById(request, reply) {
  try {
    const timeTrackerId = request.params.id;
    const timeTracker = await prisma.timeTracker.findFirst({
      where: {
        id: timeTrackerId,
      },
      include: {
        task: {
          select: {
            name: true
          }
        },
        collaborator: {
          select: {
            name: true
          }
        }
      }
    });
    if (!timeTracker) {
      reply.status(404).send({ error: 'TimeTracker não encontrado' });
    } else {
      reply.send(timeTracker);
    }
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
}