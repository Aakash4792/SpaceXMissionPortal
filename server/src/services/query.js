const DEFAULT_PAGE_LIMT = 0;
const DEFUALT_PAGE_NUMBER = 1;

function getPagination(query) {
  const limit = Math.abs(query.limit) || DEFAULT_PAGE_LIMT;
  const page = Math.abs(query.page) || DEFUALT_PAGE_NUMBER;
  const skip = (page - 1) * limit;
  return { skip, limit };
}

module.exports = {
  getPagination,
};
