import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { goals, goalsCompletions } from "../db/schema";
import dayjs from "dayjs";

export async function getWeekSummary() {
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
  const goalsCompletedInWeek = db.$with('goal_completed_in_week').as(
    db.select({
      id: goalsCompletions.id,
      title: goals.title,
      completedAt: goalsCompletions.createdAt,
      completedAtDate: sql/*sql*/`
        DATE(${goalsCompletions.createdAt})
      `.as('completedAtDate'),
    })
      .from(goalsCompletions)
      .innerJoin(goals, eq(goals.id, goalsCompletions.goalId))
      .where(
        and(
          gte(goalsCompletions.createdAt, firstDayOfWeek),
          lte(goalsCompletions.createdAt, lastDayOfWeek),
        )
      )
  );

  const goalsCompletedByWeekDay = db.$with('goals_completed_by_week_day').as(
    db
      .select({
        completedAtDate: goalsCompletedInWeek.completedAtDate,
        completions: sql/*sql*/`
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id',${goalsCompletedInWeek.id},
              'title',${goalsCompletedInWeek.title},
              'completedAt',${goalsCompletedInWeek.completedAt}
            )
          )
        `.as('completions'),
      })
      .from(goalsCompletedInWeek)
      .groupBy(goalsCompletedInWeek.completedAtDate)
  )

  const result = await db
    .with(goalsCreatedUpToWeek, goalsCompletedInWeek, goalsCompletedByWeekDay)
    .select({
      completed: sql/*sql*/`(SELECT COUNT(*) FROM ${goalsCompletedInWeek})`.mapWith(
        Number
      ),
      total: sql/*sql*/`(SELECT SUM(${goalsCreatedUpToWeek.desireWeeklyFrequency}) FROM ${goalsCreatedUpToWeek})`.mapWith(
        Number
      ),
      goalsPerDay: sql/*sql*/`
        JSON_OBJECT_AGG(
          ${goalsCompletedByWeekDay.completedAtDate},
          ${goalsCompletedByWeekDay.completions}
        )
      `
    })
    .from(goalsCompletedByWeekDay)

  return {
    summary: result,
  }
}