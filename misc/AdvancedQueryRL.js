class AdvancedQueryRL {
    constructor(query, queryString) {
        this.query = query; // query = TradeRL.find()
        this.queryString = queryString; // queryString = { userID: 5f61179c4f3b2c0017cf96c7 }
        this.excludedFields = ["search", "page", "limit", "platform"];
    }

    filter() {
        // deletes fields with "Any" filter attribute
        let queryObj = { ...this.queryString };
        Object.keys(queryObj).forEach((q) => {
            if (queryObj[q] === "Any" && !this.excludedFields.some(field => q === field)) {
                delete queryObj[q];
            }
        });

        const platform = queryObj['platform'] === 'Any' ? {$exists: true} : queryObj['platform'];
        
        let editedObj; 
        if (queryObj.search === "I want to sell" || queryObj.search === "I want to buy") {
            let tradeOption = queryObj.search === "I want to sell" ? "want" : "have";
            editedObj = {[tradeOption]: {$elemMatch: queryObj}, 'platform.name': platform }; 
            this.excludedFields.map((field) => delete editedObj[tradeOption]['$elemMatch'][field]);
        } 

        if (queryObj.search === "Any") {
            let want = {'want': {$elemMatch: queryObj}, 'platform.name': platform};
            let have = {'have': {$elemMatch: queryObj}, 'platform.name': platform};
            editedObj = { $or: [ want, have ] };
            this.excludedFields.map((field) => {
                delete editedObj['$or'][0]['want']['$elemMatch'][field]; 
                delete editedObj['$or'][1]['have']['$elemMatch'][field];
            });
        }

        console.log(editedObj);
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
        this.query.sort("-bumpedAt");
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
