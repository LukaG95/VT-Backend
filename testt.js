const queryStr = `{"itemID": "12", "itemName": "Zomba", "cert": "Striker", "paint": "Black", "page": "1", "limit": "10"}`

//const tradeOption = (queryObj.search === '1') ? 'want' : 'have'
const tradeOption = "have"

const editedStr = queryStr.replace(/\b(itemID|itemType|cert|paint)\b/g, (match) => `${tradeOption}.${match}`)
console.log(editedStr)