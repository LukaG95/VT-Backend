class AdvancedQueryRL {
  constructor(query, queryString) {
    this.query = query                                // query = TradeRL.find()
    this.queryString = queryString                    // queryString = { userID: 5f61179c4f3b2c0017cf96c7 }
    this.excludedFields = ['search', 'page', 'limit']
  }

  filter() {
    // deletes fields with "Any" filter attribute
    const queryObj = { ...this.queryString }  
    Object.keys(queryObj).forEach((q) => {
      if (queryObj[q] === 'any') {
        delete queryObj[q]
      }
    })
    
    const queryStr = JSON.stringify(queryObj) // queryStr = `{"itemID": "12", "itemName": "Zomba", "cert": "Striker", "paint": "Black", "page": "1", "limit": "10"}`

    const tradeOption = (queryObj.search === 'I want to sell') ? 'want' : 'have'
    const editedStr = queryStr.replace(/\b(itemID|itemType|cert|paint)\b/g, (match) => `${tradeOption}.${match}`)

    const editedObj = JSON.parse(editedStr) // editedObj = {"want.itemID": "12", "want.cert": "Striker", "want.paint": "Black", "page": "1", "limit": "10"}

    this.excludedFields.map((field) => delete editedObj[field])

    this.query = this.query.find(editedObj) 
    return this
  }

  paginate() {
    const page = this.queryString.page * 1 || 1
    let limit = this.queryString.limit * 1 || 15
    const skip = (page - 1) * limit

    if (limit < 0 || limit > 50) limit = 15

    this.limit = limit
    this.query = this.query.skip(skip).limit(limit)
    return this
  }

  sortByLatest() {
    this.query.sort('-createdAt')
    return this
  }

  resetQuery() {
    delete this.query.skip()
    delete this.query.limit()
    delete this.query.sort()
    return this
  }
}

module.exports = AdvancedQueryRL
