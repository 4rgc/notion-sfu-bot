import DbStore from '../dbStore';

type A = {
	a: string;
};

describe('dbStore', () => {
	it('should call subscriber on record change', () => {
		const store = new DbStore<A>();

		const subscriber = jest.fn(() => {
			return undefined;
		});
		store.subscribeOnRecordChanged(subscriber);

		store.setRecord(['a', { a: 'a' }]);

		expect(subscriber).toHaveBeenCalledTimes(1);
	});

	it('should pass args to subscriber on record change', () => {
		const store = new DbStore<A>();

		const subscriber = jest.fn(() => {
			return undefined;
		});
		store.subscribeOnRecordChanged(subscriber);

		store.setRecord(['a', { a: 'a' }]);

		expect(subscriber).toHaveBeenCalledWith({
			key: 'a',
			prevValue: undefined,
			changedValue: { a: 'a' },
		});
	});

	it('should return new records', () => {
		const store1 = new DbStore<A>({ key1: { a: 'a' } });

		const store2 = new DbStore<A>({ key1: { a: 'a' }, key2: { a: 'new' } });

		expect(store1.getNewRecords(store2)).toStrictEqual(['key2']);
	});
});
