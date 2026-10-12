import { decodeSharedList, encodeSharedList } from './list-share';

describe('list share encoding', () => {
  it('round trips a list', () => {
    const payload = {
      name: 'Sunday Dinner',
      recipes: [
        { filename: '0001', batches: 2 },
        { filename: '0042', batches: 1 },
      ],
    };

    expect(decodeSharedList(encodeSharedList(payload))).toEqual(payload);
  });

  it('round trips non-ascii names', () => {
    const payload = { name: 'Grandma’s Crème Brûlée 🍮', recipes: [] };

    expect(decodeSharedList(encodeSharedList(payload))).toEqual(payload);
  });

  it('throws on garbage input', () => {
    expect(() => decodeSharedList('not-base64!!')).toThrow();
  });
});
