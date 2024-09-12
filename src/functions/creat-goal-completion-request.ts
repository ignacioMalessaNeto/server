import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db"
import { goals, goalsCompletions } from "../db/schema"
import dayjs from "dayjs";

interface CreateGoalCompletionRequest {
  goalId: string
}

export async function createGoalCompletion({
  goalId
}: CreateGoalCompletionRequest) {
  const firstDayOfWeek = dayjs().startOf('week').toDate();
  const lastDayOfWeek = dayjs().endOf('week').toDate();

  const goalsCompletionsCounts = db.$with('goal_completion_counts').as(
    db.select({
      goalId: goalsCompletions.goalId,
      completionCount: count(goalsCompletions.id)
        .as('completionCount'),
    })
      .from(goalsCompletions)
      .where(
        and(
          gte(goalsCompletions.createdAt, firstDayOfWeek),
          lte(goalsCompletions.createdAt, lastDayOfWeek),
          eq(goalsCompletions.id, goalId)
        )
      )
      .groupBy(goalsCompletions.goalId)
  );

  const result = await db
    .with(goalsCompletionsCounts)
    .select({
      desireWeeklyFrequency: goals.desireWeeklyFrequency,
      completionCount: sql/*sql*/`
        COALESCE(${goalsCompletionsCounts.completionCount}, 0)
      `.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalsCompletionsCounts, eq(goalsCompletionsCounts.goalId, goals.id))
    .where(eq(goals.id, goalId))
    .limit(1)
  const { completionCount, desireWeeklyFrequency } = result[0];

  if (completionCount >= desireWeeklyFrequency) {
    throw new Error('Goal already completed this week')
  }

  const insertResult = await db
    .insert(goalsCompletions)
    .values({ goalId })
    .returning()

  const goalCompletion = insertResult[0];

  return {
    goalCompletion
  };
}