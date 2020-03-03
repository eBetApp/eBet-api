function sum(a: number, b: number): number {
	return a + b;
}

test('sum 1 + 2 = 3', () => {
	expect(sum(1, 2)).toBe(3);
});
