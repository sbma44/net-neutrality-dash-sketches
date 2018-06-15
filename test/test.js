const tape = require('tape');
const getThisWeek = require('../athena').getThisWeek;


tape('getThisWeek', function(t) {
    const start = +new Date();
    for(let day = 0; day < 365; day++) {
        let dt = new Date(start + (1000 * 24 * 60 * 60 * day));
        let dates = getThisWeek(+dt);
        const label = dt.toISOString().split('T')[0];
        t.equals(dates.length, 7, `${label} - 7 day week`);
        t.equals(new Date(dates[0]).getDay(), 0, `${label} - first entry is a Sunday`);
        t.equals(new Date(dates[6]).getDay(), 6, `${label} - last entry is a Saturday`);
    }
    t.end();
});