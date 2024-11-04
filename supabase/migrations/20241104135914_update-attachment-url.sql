UPDATE
    attachments
SET
    url = (
        SELECT
            CASE
                WHEN strpos(a2.url, '?') > 0 THEN SUBSTRING(
                    a2.url,
                    strpos(a2.url, '/attachments'),
                    strpos(a2.url, '?') - strpos(a2.url, '/attachments')
                )
                ELSE a2.url
            END
        FROM
            attachments a2
        WHERE
            attachments.id = a2.id
    )