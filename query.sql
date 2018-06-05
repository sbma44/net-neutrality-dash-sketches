WITH

medians AS (
    SELECT
        dt,
        approx_percentile(timetaken, 0.5) AS pct_50

    FROM "sdk_events"."instrumentile_source_vt"

    WHERE geocodeisp IN
    ('Allied Telecom Group, LLC',
    'AT&T Services, Inc.',
    'Charter Communications',
    'Cogent Communications',
    'Comcast Cable Communications, LLC',
    'Cox Communications Inc.',
    'Level 3 Parent, LLC',
    'MCI Communications Services, Inc. d/b/a Verizon Business',
    'Qwest Communications Company, LLC',
    'Time Warner Cable Internet LLC')

    GROUP BY dt
),

isp AS (
    SELECT
        dt,
        geocodeisp,
        array_agg(distinct geocodeasn) AS geocodeasns,
        count(timetaken) as "count",
        approx_percentile(timetaken, 0.25) AS pct_25,
        approx_percentile(timetaken, 0.5) AS pct_50,
        approx_percentile(timetaken, 0.75) AS pct_75

    FROM "sdk_events"."instrumentile_source_vt"

    WHERE geocodecountrycode='US'

    AND geocodeisp IN
    ('Allied Telecom Group, LLC',
    'AT&T Services, Inc.',
    'Charter Communications',
    'Cogent Communications',
    'Comcast Cable Communications, LLC',
    'Cox Communications Inc.',
    'Level 3 Parent, LLC',
    'MCI Communications Services, Inc. d/b/a Verizon Business',
    'Qwest Communications Company, LLC',
    'Time Warner Cable Internet LLC')


    GROUP BY geocodeisp, dt

    HAVING COUNT(timetaken) > 500
)

SELECT
    isp.dt,
    isp.geocodeisp,
    isp.geocodeasns,
    isp."count",
    isp.pct_25 - medians.pct_50 AS pct_25_norm,
    isp.pct_50 - medians.pct_50 AS pct_50_norm,
    isp.pct_75 - medians.pct_50 AS pct_75_norm

FROM isp LEFT JOIN medians ON isp.dt = medians.dt

ORDER BY isp.geocodeisp ASC, isp.dt ASC;
