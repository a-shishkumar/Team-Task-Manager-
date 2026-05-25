/**
 * Helper class for building MongoDB query features
 * Supports filtering, sorting, field selection, and pagination
 */
class QueryBuilder {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.pagination = {};
  }

  /**
   * Filter results based on query parameters
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'q'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced filtering (gt, gte, lt, lte, in)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in|ne|regex)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * Search across specified fields
   */
  search(fields = ['title', 'name', 'description']) {
    const searchTerm = this.queryString.search || this.queryString.q;
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, 'i');
      const searchQuery = fields.map((field) => ({ [field]: searchRegex }));
      this.query = this.query.find({ $or: searchQuery });
    }
    return this;
  }

  /**
   * Sort results
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * Select specific fields
   */
  selectFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /**
   * Paginate results
   */
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.pagination = { page, limit, skip };
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  /**
   * Get pagination info with total count
   */
  async getPaginationInfo(model, filter = {}) {
    const total = await model.countDocuments(filter);
    const totalPages = Math.ceil(total / this.pagination.limit);

    return {
      page: this.pagination.page,
      limit: this.pagination.limit,
      total,
      totalPages,
      hasNextPage: this.pagination.page < totalPages,
      hasPrevPage: this.pagination.page > 1,
    };
  }
}

module.exports = QueryBuilder;
