class AdvancedQueryRL {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
        this.excludedFields = ['search', 'page', 'limit'];
    }

    filter() {
        const queryObj = { ...this.queryString };
        Object.keys(queryObj).forEach((q) => {
            if (queryObj[q] === 'any') {
                delete queryObj[q];
            }
        });
        const queryStr = JSON.stringify(queryObj);
        const tradeOption = (queryObj.search === '1') ? 'want' : 'have';
        const editedStr = queryStr.replace(/\b(itemID|itemType|cert|paint)\b/g, (match) => `${tradeOption}.${match}`);

        const editedObj = JSON.parse(editedStr);

        this.excludedFields.map((field) => delete editedObj[field]);

        this.query = this.query.find(editedObj);
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        let limit = this.queryString.limit * 1 || 15;
        const skip = (page - 1) * limit;

        if (limit < 0 || limit > 50) limit = 15;

        this.limit = limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }

    sortByLatest() {
        this.query.sort('-createdAt');
        return this;
    }

    resetQuery() {
        delete this.query.skip();
        delete this.query.limit();
        delete this.query.sort();
        return this;
    }
}


module.exports = AdvancedQueryRL;
