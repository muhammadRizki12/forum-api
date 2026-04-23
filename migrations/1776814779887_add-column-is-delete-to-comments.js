export const up = (pgm) => {
  pgm.addColumn('comments', {
    // eslint-disable-next-line camelcase
    is_delete: {
      type: 'BOOLEAN',
      notNull: true,
      default: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('comments', 'is_delete');
};
