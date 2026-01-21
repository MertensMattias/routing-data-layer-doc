SELECT 
    c.name AS column_name,
    dc.name AS constraint_name,
    dc.definition AS default_value
FROM sys.columns c
LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
INNER JOIN sys.tables t ON c.object_id = t.object_id
WHERE t.name = 'sys_AuditLog'
ORDER BY c.column_id;
