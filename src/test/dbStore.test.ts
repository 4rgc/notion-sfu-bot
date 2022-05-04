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

	it('should not call the removed subscriber on record change', () => {
		const store = new DbStore<A>();

		const subscriber = jest.fn();

		const otherSub1 = jest.fn(),
			otherSub2 = jest.fn();

		store.subscribeOnRecordChanged(otherSub1);
		store.subscribeOnRecordChanged(subscriber);
		store.subscribeOnRecordChanged(otherSub2);

		store.unsubscribeOnRecordChanged(subscriber);

		store.setRecord(['a', { a: 'a' }]);

		expect(subscriber).not.toBeCalled();
		expect(otherSub1).toBeCalledTimes(1);
		expect(otherSub2).toBeCalledTimes(1);
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

	it('should return true if other store has new records', () => {
		const store1 = new DbStore<A>({ key1: { a: 'a' } });

		const store2 = new DbStore<A>({ key1: { a: 'a' }, key2: { a: 'new' } });

		expect(store1.hasNewRecords(store2)).toBe(true);
	});

	it('should initialize the db with the data in the argument', () => {
		const data = { key: { a: 'a' } };

		const store = new DbStore(data);

		expect(store.getRecord('key')).toStrictEqual(data.key);
	});

	it('should reset the store', () => {
		const newData = { new: { a: 'new' } };

		const store = new DbStore({ a: { a: 'a' } });

		store.setStore(newData);

		expect(store.getRecord('a')).toBeUndefined();
		expect(store.getRecord('new')).toStrictEqual({ a: 'new' });
	});

	it('should set the record to the new value', () => {
		const newValue = { a: 'newValue' };

		const store = new DbStore({ a: { a: 'a' } });

		store.setRecord(['a', newValue]);

		expect(store.getRecord('a')).toStrictEqual(newValue);
	});

	it('should initialize with a copy instead of the reference', () => {
		const data: any = { a: { a: 'a' }, b: undefined };

		const store = new DbStore(data);

		data.a.a = 'qweqwe';

		data.a = { a: 'asdasd' };
		data.b = { b: 'dsad' };

		expect(store.getRecord('a')).toStrictEqual({ a: 'a' });
		expect(store.getRecord('b')).toBeUndefined();
	});

	it('should save a copy instead of the reference', () => {
		const data = { a: { a: 'a' } };
		const newValue = { a: 'new' };

		const store = new DbStore(data);

		store.setRecord(['a', newValue]);

		expect(store.getRecord('a')).toStrictEqual(newValue);
	});
});
