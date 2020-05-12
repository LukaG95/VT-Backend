
function setName(name) {
    const name1 = name;
    const rlitems = {
        bodies: [
            {
                name: 'Backfire',
                color: 'Default',
                url: '21.0.webp',
            },
            {
                name: 'Breakout',
                color: 'Default',
                url: '22.0.webp',
            },
            {
                name: 'Breakout',
                color: 'Crimson',
                url: '22.1.webp',
            },
        ],

        wheels: [
            {
                name: 'Backfire',
                color: 'Default',
                url: '21.0.webp',
            },
            {
                name: 'Breakout',
                color: 'Default',
                url: '22.0.webp',
            },
            {
                name: 'Breakout',
                color: 'Crimson',
                url: '22.1.webp',
            }],
    };

    rlitems[name].map((item) => {
        console.log(item.name);
    });
}

setName('bodies');
