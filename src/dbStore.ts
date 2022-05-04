import _ from 'lodash';

export type recordChangedSubscriber<T> = ({
	key,
	prevValue,
	changedValue,
}: {
	key: string;
	prevValue?: T;
	changedValue?: T;
}) => void;

export default class DbStore<T> {
	public constructor(data: Record<string, T> = {}) {
		this.store = _.cloneDeep(data);
	}

	public setStore(data: Record<string, T>) {
		this.store = data;
	}

	public hasNewRecords(newer: DbStore<T>) {
		return this.getNewRecords(newer).length > 0;
	}

	public getNewRecords(newer: DbStore<T>) {
		const newRecordIds = [];

		for (const [key] of Object.entries(newer.store)) {
			const pageId = key;

			if (!(pageId in this.store)) {
				newRecordIds.push(pageId);
			}
		}
		return newRecordIds;
	}

	public setRecord([key, value]: [string, T]) {
		if (!this.store[key] || !_.isEqual(this.store[key], value)) {
			const prevValue = this.store[key];
			this.store[key] = _.cloneDeep(value);

			this.onRecordChanged(key, prevValue, this.store[key]);
		}
	}

	public getRecord(key: string) {
		return _.cloneDeep(this.store[key]);
	}

	public subscribeOnRecordChanged(subscriber: recordChangedSubscriber<T>) {
		if (!this.recordChangedSubscribers.find((e) => e === subscriber))
			this.recordChangedSubscribers.push(subscriber);
	}

	public unsubscribeOnRecordChanged(subscriber: recordChangedSubscriber<T>) {
		const index = this.recordChangedSubscribers.findIndex(
			(e) => e === subscriber
		);
		if (index !== -1) this.recordChangedSubscribers.splice(index, 1);
	}

	private store: Record<string, T> = {};
	private recordChangedSubscribers: recordChangedSubscriber<T>[] = [];

	private onRecordChanged(key: string, prevValue: T, changedValue: T) {
		for (const subscriber of this.recordChangedSubscribers) {
			subscriber({ key, prevValue, changedValue });
		}
	}
}
