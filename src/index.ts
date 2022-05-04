import express from 'express';
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import DbStore, { recordChangedSubscriber } from './dbStore';
import getTasksFromNotionDb, { Task } from './getTasksFromNotionDb';

const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const projectRelations = Object.freeze({
	Other: {
		relation: [
			{
				id: '28e8bd4b-21ef-419b-b665-95a1165e2d29',
			},
		],
	},
	Autodesk: {
		relation: [
			{
				id: '52979d0a-f483-47bb-817f-a6bf60188a22',
			},
		],
	},
	School: {
		relation: [
			{
				id: 'f573b9be-9739-4461-a754-44c4f066769e',
			},
		],
	},
	SFU: {
		relation: [
			{
				id: '2698f0e7-fd68-48e1-9c23-bb0700a3eefd',
			},
		],
	},
});

dotenv.config();

const andriiNotion = new Client({ auth: process.env.ANDRII_BOT_API_KEY });
const sfuNotion = new Client({ auth: process.env.SFU_BOT_API_KEY });

const sfuDbId = process.env.SFU_DB_ID;
const myDbId = process.env.MY_DB_ID;

const localMyDbStore = new DbStore<Task>({});
const localSfuDbStore = new DbStore<Task>({});

const onSfuDbRecordChanged: recordChangedSubscriber<Task> = ({
	key,
	changedValue,
}) => {
	console.log(`SFU record changed: ${changedValue?.Title}`);
	console.log(changedValue);
	if (changedValue) localMyDbStore.setRecord([key, changedValue]);
};

const onMyDbRecordChanged: recordChangedSubscriber<Task> = ({
	prevValue,
	changedValue,
}) => {
	console.log(`My record changed: ${changedValue?.Title}`);
	if (!prevValue && changedValue) {
		if (!changedValue.Assignee?.includes('Andrii Bohdan')) return;

		const task = changedValue;

		console.log(`Adding ${changedValue.Title} to my db`);
		andriiNotion.pages.create({
			parent: {
				database_id: myDbId || '',
			},
			properties: {
				Task: {
					title: [
						{
							text: {
								content: task.Title,
							},
							type: 'text',
						},
					],
					type: 'title',
				},
				'Kanban - State': task.State
					? {
							select: {
								name: task.State || null,
							},
					  }
					: undefined,
				Due: task.Due
					? {
							date: {
								start: task.Due,
							},
					  }
					: undefined,
				Project: projectRelations.SFU,
				Priority: task.Priority
					? {
							select: {
								name: task.Priority || null,
							},
					  }
					: undefined,
			},
		} as any);
	}
};

localSfuDbStore.subscribeOnRecordChanged(onSfuDbRecordChanged);
localMyDbStore.subscribeOnRecordChanged(onMyDbRecordChanged);

const loop = async () => {
	console.log('Looking for new records in the SFU database...');
	while (1) {
		try {
			await pollSfuDb();
		} catch (e) {
			console.error(e);
		}
		await sleep(30000);
	}
};

const pollSfuDb = async () => {
	const latestData = await getTasksFromNotionDb(sfuNotion, sfuDbId || '');
	const latestSfuStore = new DbStore(latestData);

	if (localSfuDbStore.hasNewRecords(latestSfuStore)) {
		const newTaskKeys = localSfuDbStore.getNewRecords(latestSfuStore);

		for (const key of newTaskKeys) {
			localSfuDbStore.setRecord([key, latestSfuStore.getRecord(key)]);
		}
	}
};

const app = express();

app.listen(8080, async () => {
	console.log('Listening on port 8080...');
	localMyDbStore.setStore(
		await getTasksFromNotionDb(andriiNotion, myDbId || '')
	);
	localSfuDbStore.setStore(
		await getTasksFromNotionDb(sfuNotion, sfuDbId || '')
	);
	loop();
});
