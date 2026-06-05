class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excluded = ['page', 'sort', 'limit', 'fields', 'keyword', 'category', 'minPrice', 'maxPrice'];
    excluded.forEach((key) => delete queryObj[key]);

    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key] === '') delete queryObj[key];
    });

    this.query = this.query.find(queryObj);
    return this;
  }

  search() {
    if (this.queryString.keyword) {
      const keyword = this.queryString.keyword;
      this.query = this.query.find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ],
      });
    }
    return this;
  }

  categoryFilter() {
    if (this.queryString.category && this.queryString.category !== 'all') {
      this.query = this.query.find({ category: this.queryString.category });
    }
    return this;
  }

  priceFilter() {
    const filter = {};
    if (this.queryString.minPrice) filter.$gte = Number(this.queryString.minPrice);
    if (this.queryString.maxPrice) filter.$lte = Number(this.queryString.maxPrice);
    if (Object.keys(filter).length) {
      this.query = this.query.find({ price: filter });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 12;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = APIFeatures;
