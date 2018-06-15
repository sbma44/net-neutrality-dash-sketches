const fs = require('fs');
const aws = require('aws-sdk')
const athena = new aws.Athena({ region: 'us-east-1' });

function getThisWeek(originalDate) {
    originalDate = originalDate || +new Date();
    const dates = [];
    let dt = new Date(originalDate);
    // set dt to 12 noon to avoid 00:00:00 day-of-week weirdness
    dt = new Date(dt.getTime() - (dt.getTime() % (24 * 60 * 60 * 1000)) + (12 * 60 * 60 * 1000));

    // back up to Sunday
    for(let i = dt.getDate(); dt.getDay() > 0; i--)
        dt.setDate(i);

    // run for 7 days
    for(let i = 0; i < 7; i++)
        dates.push((i * 24 * 60 * 60 * 1000) + dt.getTime());

    dates.sort();

    return dates;
}

function justTheDate(timestamp) {
    return (new Date(timestamp)).toISOString().split('T')[0];
}

function runQuery(type, date) {
    if (!fs.existsSync(`${__dirname}/query-${type}.sql`))
        return;

    const week = getThisWeek(date);
    const weekStart = justTheDate(week[0]);
    const weekSQL = '\'' + getThisWeek().map(justTheDate).join('\',\'') + '\'';

    const params = {
        QueryExecutionContext: {
            Database: 'sdk_events'
        },
        QueryString: fs.readFileSync(`${__dirname}/query-${type}.sql`).toString().replace(/\{\{weekSQL\}\}/g, weekSQL),
        ResultConfiguration: {
            OutputLocation: `s3://mapbox/playground/sbma44/net-neutrality-dashboard/${weekStart}-${type}`
        }
    };

    athena.startQueryExecution(params, function(err, data) {
        if (err) console.error('[error]: ' + err);
        else console.log(data);
    });
}

if (require.main === module) {
    const argv = require('minimist')(process.argv.slice(2));
    ['time', 'dns', 'tcp'].forEach((query) => {
        runQuery(query, argv.date);
    });
}

module.exports.getThisWeek = getThisWeek;