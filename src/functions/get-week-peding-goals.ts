import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { db } from "../db";
import { goals } from "../db/schema";
import { and, lte, sql } from "drizzle-orm";

dayjs.extend(weekOfYear);

export function getWeekPendingGoals() {
  const lastDayOfWeek = dayjs().endOf('week');
  // const currentWeek = dayjs().week();

  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db.select({
      id: goals.id,
      title: goals.title,
      desireWeeklyFrequency: goals.desired_weekly_frequency,

    }).from(goals).where(lte(goals.createdAt, lastDayOfWeek))
  );
}