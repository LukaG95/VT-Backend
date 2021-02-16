function toString(timeAgo, option) {
    const string = timeAgo === 1 ? `${timeAgo} ${option} ago` : `${timeAgo} ${option}s ago`;
    return string;
}

function dateToAgo(date) {
    let timeAgo = Math.round((Date.now() - new Date(date)) / 1000);

    if (timeAgo > 86400) {
        timeAgo = toString(Math.round(timeAgo / 86400), "day");
    } else if (timeAgo > 3600) {
        timeAgo = toString(Math.round(timeAgo / 3600), "hour");
    } else if (timeAgo > 60) {
        timeAgo = toString(Math.round(timeAgo / 60), "minute");
    } else {
        timeAgo = toString(timeAgo, "second");
    }
    return timeAgo;
}

function readableActiveAt(trades) {
    const editedTrades = trades.map((trade) => {
        const editedTrade = trade.toObject();
        editedTrade.createdAt = dateToAgo(editedTrade.createdAt);
        editedTrade.expiresIn = {
            days: Math.floor(10 - (new Date() - editedTrade.bumpedAt) / (1000 * 3600 * 24)),
            at: `${editedTrade.bumpedAt.getHours()}:${editedTrade.bumpedAt.getMinutes()}`
        };
        editedTrade.bumpedAt = dateToAgo(editedTrade.bumpedAt);
        return editedTrade;
    });

    return editedTrades;
}

function readableDialoguesCreatedAt(dialogues) {
  dateNow = Date.now();
  
  dialogues = dialogues.map((dialogue) => {
    const timeAgo = Math.round((dateNow - dialogue.createdAt.timestamp) / 1000);

    if (timeAgo > 2 * 86400) dialogue.createdAt = dialogue.createdAt.fulldate;
    else if (timeAgo > 86400) dialogue.createdAt = 'yesterday'
    else dialogue.createdAt = dialogue.createdAt.hourminutes

    return dialogue
      
  })

  return dialogues
}

function readableSocketMessageCreatedAt(createdAt) {
  const date = new Date(createdAt);
  
  let hours = date.getHours();
  let minutes = date.getMinutes();
  
  if (hours <= 9) hours = `0${hours}`
  if (minutes <= 9) minutes = `0${minutes}`
  
  return `${hours}:${minutes}`
  
  }

exports.readableActiveAt = readableActiveAt
exports.readableDialoguesCreatedAt = readableDialoguesCreatedAt
exports.readableSocketMessageCreatedAt = readableSocketMessageCreatedAt
exports.dateToAgo = dateToAgo
