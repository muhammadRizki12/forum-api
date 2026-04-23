export const up = (pgm) => {
  pgm.addColumn('replies', {
    // eslint-disable-next-line camelcase
    is_delete: {
      type: 'BOOLEAN',
      notNull: true,
      default: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('replies', 'is_delete');
};
