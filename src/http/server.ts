import fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { createCompletionRoute } from "../routes/create-complete-goal";
import { createGoalRoute } from "../routes/create-goal";
import { getPendingGoalsRoute } from "../routes/get-pending-goals";
import { getWeekSummaryRoute } from "../routes/get-week-summary";
import fastifyCors from "@fastify/cors";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
	origin: '*',
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(createCompletionRoute);
app.register(getPendingGoalsRoute);
app.register(createGoalRoute);
app.register(getWeekSummaryRoute);


app
	.listen({
		port: 3333,
	})
	.then(() => {
		console.log("Server running on port 3333");
	});

// WITH "goals_created_up_to_week" AS (
//     SELECT
//         "id",
//         "title",
//         "desired_weekly_frequency",
//         "created_at"
//     FROM
//         "goals"
//     WHERE
//         "goals"."created_at" <= '2024-09-15T02:59:59.999Z'
// ),
// "goal_completion_counts" AS (
//     SELECT
//         "goal_id",
//         COUNT("id") AS "completionCount"
//     FROM
//         "goal-completions"
//     WHERE
//         "goal-completions"."created_at" >= '2024-09-08T03:00:00.000Z'
//         AND "goal-completions"."created_at" <= '2024-09-15T02:59:59.999Z'
//     GROUP BY
//         "goal-completions"."goal_id"
// )
// SELECT
//     "goals_created_up_to_week"."id",
//     "goals_created_up_to_week"."title",
//     "goals_created_up_to_week"."desired_weekly_frequency",
//     COALESCE("completionCount", 0) as "completionCount"
// FROM
//     "goals_created_up_to_week"
// LEFT JOIN
//     "goal_completion_counts"
// ON
//     "goal_completion_counts"."goal_id" = "goals_created_up_to_week"."id";
