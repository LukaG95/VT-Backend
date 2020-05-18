function dateToAgo(date) {
    let timeAgo = Math.round((Date.now() - new Date(date)) / 1000);

    if (timeAgo > 86400) {
        timeAgo = `${Math.round(timeAgo / 86400)} days ago`;
    } else if (timeAgo > 3600) {
        timeAgo = `${Math.round(timeAgo / 3660)} hours ago`;
    } else if (timeAgo > 60) {
        timeAgo = `${Math.round(timeAgo / 60)} minutes ago`;
    }

    return timeAgo;
}


module.exports = dateToAgo;
