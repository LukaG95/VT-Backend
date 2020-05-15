class AdvancedQueryRL {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
        this.excludedFields = ['search', 'page', 'limit'];
    }

    filter() {
        const queryObj = { ...this.queryString };
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
        const limit = this.queryString.limit * 1 || 15;
        const skip = (page - 1) * limit;


        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}


module.exports = AdvancedQueryRL;
