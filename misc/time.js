function toString(timeAgo, option) {
    const string = (timeAgo === 1) ? `${timeAgo} ${option} ago` : `${timeAgo} ${option}s ago`
    return string
}

function dateToAgo(date) {
    let timeAgo = Math.round((Date.now() - new Date(date)) / 1000)

    if (timeAgo > 86400) {
        timeAgo = toString(Math.round(timeAgo / 86400), 'day')
    } else if (timeAgo > 3600) {
        timeAgo = toString(Math.round(timeAgo / 3600), 'hour')
    } else if (timeAgo > 60) {
        timeAgo = toString(Math.round(timeAgo / 60), 'minute')
    } else {
        timeAgo = toString(timeAgo, 'second')
    }
    return timeAgo
}
 
function readableActiveAt(trades){

  const editedTrades = trades.map((trade) => {
    const editedTrade = trade.toObject()
    editedTrade.createdAt = dateToAgo(editedTrade.createdAt)
    if (editedTrade.bumpedAt) 
      editedTrade.bumpedAt = dateToAgo(editedTrade.bumpedAt)
    return editedTrade
  })

  return editedTrades
}

exports.readableActiveAt = readableActiveAt
exports.dateToAgo = dateToAgo