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
            if (queryObj[q] === "Any" && q !== 'search') {
                delete queryObj[q];
            }
        });

        queryObj['platform.name'] = queryObj.platform; // platform = 'Steam' to platform.name = 'Steam'

        const queryStr = JSON.stringify(queryObj); // queryStr = `{"itemID": "12", "itemName": "Zomba", "cert": "Striker", "paint": "Black", "page": "1", "limit": "10"}`

        const tradeOption = queryObj.search === "I want to sell" ? "want" : "have";

        let editedStr;
        let editedObj; // editedObj = {"want.itemID": "12", "want.cert": "Striker", "want.color": "Black", "page": "1", "limit": "10"}

        if (queryObj.search === "I want to sell" || queryObj.search === "I want to buy") {
            let tradeOption = queryObj.search === "I want to sell" ? "want" : "have";
            editedStr = queryStr.replace(/\b(itemID|itemType|cert|color)\b/g, (match) => `${tradeOption}.${match}`);
            editedObj = JSON.parse(editedStr); 
            this.excludedFields.map((field) => delete editedObj[field]);
        } 

        if (queryObj.search === "Any") {
            let want = queryStr.replace(/\b(itemID|itemType|cert|color)\b/g, (match) => `want.${match}`);
            let have = queryStr.replace(/\b(itemID|itemType|cert|color)\b/g, (match) => `have.${match}`);
            editedObj = { $or: [ JSON.parse(want), JSON.parse(have) ] };
            this.excludedFields.map((field) => {
                delete editedObj['$or'][0][field]; 
                delete editedObj['$or'][1][field];
            });
        }

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
