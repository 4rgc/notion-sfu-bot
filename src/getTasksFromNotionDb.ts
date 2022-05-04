/* Part of this was taken from https://github.com/makenotion/notion-sdk-js/blob/ccb2180648bdba19714c40897a6bfda1c506a71a/examples/database-update-send-email/index.js */

import { Client } from '@notionhq/client';
import { RequestParameters } from '@notionhq/client/build/src/Client';

export type Task = {
	Title: string;
	State?: string;
	Due?: string;
	Assignee?: string;
	Priority?: string;
};

const getTasksFromNotionDb = async (client: Client, dbId: string) => {
	const tasks: Record<string, Task> = {};

	async function getPageOfTasks(cursor?: string) {
		let request_payload: RequestParameters;
		//Create the request payload based on the presense of a start_cursor
		if (cursor == undefined) {
			request_payload = {
				path: 'databases/' + dbId + '/query',
				method: 'post',
			};
		} else {
			request_payload = {
				path: 'databases/' + dbId + '/query',
				method: 'post',
				body: {
					start_cursor: cursor,
				},
			};
		}
		//While there are more pages left in the query, get pages from the database.
		const current_pages = await client.request<any>(request_payload);

		for (const page of current_pages.results) {
			const task: Task = { Title: '' };

			task.Title =
				page.properties.Story && page.properties.Story.title[0]
					? page.properties.Story.title[0].text.content
					: '';
			task.State =
				page.properties['Kanban - State'] &&
				page.properties['Kanban - State'].select &&
				page.properties['Kanban - State'].select.name;
			task.Due =
				page.properties.Due &&
				page.properties.Due.date &&
				page.properties.Due.date.start;
			task.Assignee =
				page.properties.Assignee &&
				page.properties.Assignee.people &&
				page.properties.Assignee.people
					.map((u: any) => u.name)
					.join(' ');
			task.Priority =
				page.properties.Priority &&
				page.properties.Priority.select &&
				page.properties.Priority.select.name;

			tasks[page.id] = task;
		}
		if (current_pages.has_more) {
			await getPageOfTasks(current_pages.next_cursor);
		}
	}
	await getPageOfTasks();
	return tasks;
};

export default getTasksFromNotionDb;
