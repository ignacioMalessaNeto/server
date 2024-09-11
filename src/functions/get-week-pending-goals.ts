import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { db } from "../db";
import { goals, goalsCompletions } from "../db/schema";
import { and, count, eq, gte, lte } from "drizzle-orm";

dayjs.extend(weekOfYear);

export function getWeekPendingGoals() {
  const firstDayOfWeek = dayjs().startOf('week').toDate();
  const lastDayOfWeek = dayjs().endOf('week').toDate();

  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db.select({
      id: goals.id,
      title: goals.title,
      desireWeeklyFrequency: goals.desireWeeklyFrequency,
      createAt: goals.createdAt,
    })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek))
  );

  const goalsCompletionsCounts = db.$with('goal_completion_counts').as(
    db.select({
      goalId: goalsCompletions.goalId,
      completionCount: count(goalsCompletions.id).as('completionCount'),
    })
      .from(goalsCompletions)
      .where(
        and(
          gte(goalsCompletions.createdAt, firstDayOfWeek),
          lte(goalsCompletions.createdAt, lastDayOfWeek),
        )
      )
      .groupBy(goalsCompletions.goalId)
  );

  const sql = db
    .with(goalsCreatedUpToWeek, goalsCompletionsCounts)
    .select()
    .from(goalsCreatedUpToWeek)
    .leftJoin(goalsCompletionsCounts, eq(goalsCompletionsCounts.goalId, goalsCreatedUpToWeek.id))

  return sql;
}
