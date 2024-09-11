import fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { createGoal } from "../functions/creat-goal";
import z from 'zod';
import { getWeekPendingGoals } from "../functions/get-week-pending-goals";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.get('/pending-goals', async () => {
	const sql = await getWeekPendingGoals()
	return sql;
});

app.post('/goals', {
	schema: {
		body: z.object({
			title: z.string(),
			desireWeeklyFrequency: z.number().int().min(1).max(7),
		})
	}
}, async (request) => {
	const { title, desireWeeklyFrequency } = request.body;

	await createGoal({
		title,
		desireWeeklyFrequency,
	})
})


app
	.listen({
		port: 3333,
	})
	.then(() => {
		console.log("Server running on port 3333");
	});

